from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    session_id: str = Field(..., description="Unique conversation session identifier")
    message: str = Field(..., min_length=1, description="User prompt/message")


class ChatMetadata(BaseModel):
    resolution_source: Literal["LIVE_INFERENCE", "LLM_CACHE"] = Field(
        ..., description="Indicates if response was newly generated or retrieved from cache"
    )
    model: str = Field(..., description="AI model used for response")
    latency_ms: int = Field(..., description="Response latency in milliseconds")
    input_tokens: int = Field(..., description="Count of prompt tokens")
    output_tokens: int = Field(..., description="Count of generated tokens")
    key_id: str = Field(..., description="Identifier of the API key used")
    fallback_attempts: int = Field(..., description="Number of fallback retries performed")


class ChatResponse(BaseModel):
    session_id: str = Field(..., description="Conversation session identifier")
    reply: str = Field(..., description="AI assistant message content")
    metadata: ChatMetadata = Field(..., description="Detailed response generation metadata")


class MessageRecord(BaseModel):
    id: int
    session_id: str
    role: Literal["user", "assistant"]
    content: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: str


class SessionMessagesResponse(BaseModel):
    session_id: str
    messages: List[MessageRecord]


class HealthResponse(BaseModel):
    status: str
    database: str
    cache: str
    key_pool: Dict[str, Any]
