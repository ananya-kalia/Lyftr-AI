import os
import uuid
import pytest
from fastapi.testclient import TestClient

# Disable remote calls and set test environment
os.environ["LITELLM_OFFLINE_MODE"] = "true"
os.environ["LITELLM_LOCAL_MODEL_COST_MAP"] = "True"
os.environ["LITELLM_TELEMETRY"] = "False"
os.environ["DATABASE_URL"] = "sqlite:///./test_app.db"
os.environ["LLM_API_KEYS"] = "key_1:mock_key_1,key_2:mock_key_2"

from main import app, llm_service
from database import init_db, get_db_path

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    init_db()
    # Reset in-memory cache between test suites
    llm_service._cache.clear()
    yield
    # Cleanup test db
    db_file = get_db_path()
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
        except Exception:
            pass


def test_health_endpoint():
    """Verify health endpoint checks backend, database, cache, and key pool."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert data["cache"] == "ready"
    assert "key_pool" in data
    assert data["key_pool"]["total_keys"] >= 2
    assert "key_1" in data["key_pool"]["keys_configured"]
    assert "key_2" in data["key_pool"]["keys_configured"]


def test_multi_turn_conversation_chat_memory():
    """Verify backend maintains conversation history and multi-turn context."""
    session_id = f"test_mem_{uuid.uuid4().hex[:8]}"

    # Turn 1: Introduce name
    res1 = client.post("/chat", json={"session_id": session_id, "message": "My name is Ananya."})
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["session_id"] == session_id
    assert "Ananya" in data1["reply"]

    # Turn 2: Ask for name
    res2 = client.post("/chat", json={"session_id": session_id, "message": "What is my name?"})
    assert res2.status_code == 200
    data2 = res2.json()
    assert "Ananya" in data2["reply"]

    # Turn 3: Check conversation history from SQLite
    history_res = client.get(f"/sessions/{session_id}/messages")
    assert history_res.status_code == 200
    history = history_res.json()["messages"]
    assert len(history) == 4
    assert history[0]["role"] == "user"
    assert history[0]["content"] == "My name is Ananya."
    assert history[1]["role"] == "assistant"
    assert history[2]["role"] == "user"
    assert history[2]["content"] == "What is my name?"
    assert history[3]["role"] == "assistant"


def test_response_caching():
    """Verify response caching for identical requests and differentiation for different prompts."""
    prompt = "What is artificial intelligence?"
    session_1 = f"cache_sess_1_{uuid.uuid4().hex[:8]}"
    session_2 = f"cache_sess_2_{uuid.uuid4().hex[:8]}"

    # 1. First request -> LIVE_INFERENCE
    res1 = client.post("/chat", json={"session_id": session_1, "message": prompt})
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["metadata"]["resolution_source"] == "LIVE_INFERENCE"
    reply_1 = data1["reply"]

    # 2. Second identical request (new session) -> LLM_CACHE
    res2 = client.post("/chat", json={"session_id": session_2, "message": prompt})
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["metadata"]["resolution_source"] == "LLM_CACHE"
    assert data2["reply"] == reply_1
    assert data2["metadata"]["latency_ms"] <= 50

    # 3. Different request -> LIVE_INFERENCE
    res3 = client.post("/chat", json={"session_id": session_1, "message": "What is Python?"})
    assert res3.status_code == 200
    data3 = res3.json()
    assert data3["metadata"]["resolution_source"] == "LIVE_INFERENCE"


def test_api_key_failover_simulation():
    """Verify automatic failover when key_1 fails via X-Simulate-Failure header."""
    session_id = f"failover_sess_{uuid.uuid4().hex[:8]}"

    response = client.post(
        "/chat",
        json={"session_id": session_id, "message": "Explain quantum computing."},
        headers={"X-Simulate-Failure": "key_1=429"}
    )
    assert response.status_code == 200
    data = response.json()
    metadata = data["metadata"]
    assert metadata["key_id"] == "key_2"
    assert metadata["fallback_attempts"] == 1
    assert metadata["resolution_source"] == "LIVE_INFERENCE"


def test_all_providers_unavailable_503():
    """Verify HTTP 503 is returned when all configured keys fail."""
    session_id = f"fail_all_sess_{uuid.uuid4().hex[:8]}"

    response = client.post(
        "/chat",
        json={"session_id": session_id, "message": "Hello there"},
        headers={"X-Simulate-Failure": "key_1=429,key_2=500"}
    )
    assert response.status_code == 503
    data = response.json()
    assert data["detail"] == "all providers unavailable"


def test_metadata_structure_exact_keys():
    """Verify metadata response matches exact field names from assignment specification."""
    session_id = f"meta_sess_{uuid.uuid4().hex[:8]}"
    res = client.post("/chat", json={"session_id": session_id, "message": "What is machine learning?"})
    assert res.status_code == 200
    meta = res.json()["metadata"]

    expected_keys = {
        "resolution_source",
        "model",
        "latency_ms",
        "input_tokens",
        "output_tokens",
        "key_id",
        "fallback_attempts"
    }
    assert expected_keys.issubset(set(meta.keys()))
    assert meta["resolution_source"] in ("LIVE_INFERENCE", "LLM_CACHE")
    assert isinstance(meta["latency_ms"], (int, float))
    assert isinstance(meta["input_tokens"], int)
    assert isinstance(meta["output_tokens"], int)
    assert isinstance(meta["fallback_attempts"], int)
