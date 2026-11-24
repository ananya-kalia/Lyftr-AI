import os
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, check_db_health, add_message, get_session_messages, get_all_sessions
from models import ChatRequest, ChatResponse, SessionMessagesResponse, HealthResponse
from llm_service import LLMService, AllProvidersUnavailableError


# Ensure database tables exist
init_db()

app = FastAPI(
    title="Lyftr AI Chatbot Service",
    description="Multi-turn LLM Chatbot with LiteLLM Key Failover, Simulation and Response Caching",
    version="1.0.0"
)

# Configure CORS
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins_env == "*":
    origins = ["*"]
else:
    origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm_service = LLMService()


@app.get("/health", response_model=HealthResponse)
def health_check():
    """
    Checks whether the backend, database, key pool and cache are working.
    """
    db_ok = check_db_health()
    return HealthResponse(
        status="healthy" if db_ok else "degraded",
        database="connected" if db_ok else "error",
        cache="ready",
        key_pool=llm_service.get_key_pool_status()
    )


@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(
    request: ChatRequest,
    x_simulate_failure: Optional[str] = Header(None, alias="X-Simulate-Failure")
):
    """
    Receives messages, maintains multi-turn conversation memory,
    handles response caching and LiteLLM key failover.
    """
    session_id = request.session_id.strip()
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id cannot be empty")

    user_text = request.message.strip()
    if not user_text:
        raise HTTPException(status_code=400, detail="message cannot be empty")

    # 1. Retrieve previous conversation history from SQLite for chat memory
    history = get_session_messages(session_id)
    messages: List[Dict[str, str]] = []
    for msg in history:
        messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })

    # Append the new user prompt
    messages.append({
        "role": "user",
        "content": user_text
    })

    # 2. Invoke LLM Service with failover, simulation, and caching
    try:
        result = llm_service.generate_chat_response(
            messages=messages,
            simulate_failure_header=x_simulate_failure
        )
    except AllProvidersUnavailableError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="all providers unavailable"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal inference error: {str(e)}"
        )

    # 3. Save both user and assistant messages in SQLite
    try:
        add_message(session_id=session_id, role="user", content=user_text, metadata=None)
        add_message(session_id=session_id, role="assistant", content=result["reply"], metadata=result["metadata"])
    except Exception as db_err:
        # Log database write error but do not fail the request completely
        print(f"Warning: Failed to persist conversation history: {db_err}")

    # 4. Return formatted response matching exact assignment specifications
    return ChatResponse(
        session_id=session_id,
        reply=result["reply"],
        metadata=result["metadata"]
    )


@app.get("/sessions/{session_id}/messages", response_model=SessionMessagesResponse)
def get_session_history(session_id: str):
    """
    Retrieves complete chronological conversation history for a given session.
    """
    messages = get_session_messages(session_id)
    return SessionMessagesResponse(
        session_id=session_id,
        messages=messages
    )


@app.get("/sessions")
def list_sessions():
    """
    List all active sessions with metadata (useful for sidebar history).
    """
    return {"sessions": get_all_sessions()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
