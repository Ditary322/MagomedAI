# core/schemas/llm.py
from pydantic import BaseModel

class LLMResponse(BaseModel):
    text: str
    sticker_id: str | None = None