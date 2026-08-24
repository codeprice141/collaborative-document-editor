from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.auth import UserResponse


class CommentReplyCreate(BaseModel):
    content: str = Field(..., min_length=1)


class CommentReplyResponse(BaseModel):
    id: int
    comment_id: int
    user_id: int
    content: str
    created_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1)
    selected_text: Optional[str] = None
    anchor_range: Optional[str] = None


class CommentResponse(BaseModel):
    id: int
    document_id: int
    user_id: int
    selected_text: Optional[str] = None
    anchor_range: Optional[str] = None
    content: str
    is_resolved: bool
    created_at: datetime
    updated_at: datetime
    user: Optional[UserResponse] = None
    replies: List[CommentReplyResponse] = []

    class Config:
        from_attributes = True
