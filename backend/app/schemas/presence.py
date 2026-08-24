from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class CursorPosition(BaseModel):
    """Cursor location in editor."""
    index: int = Field(..., ge=0)
    line: Optional[int] = None
    column: Optional[int] = None


class SelectionRange(BaseModel):
    """Text selection range."""
    start: int = Field(..., ge=0)
    end: int = Field(..., ge=0)


class UserPresence(BaseModel):
    """Live collaborator presence information."""
    user_id: int
    client_id: str
    name: str
    email: str
    color: str
    cursor: Optional[CursorPosition] = None
    selection: Optional[SelectionRange] = None
    is_typing: bool = False
    last_seen: float
