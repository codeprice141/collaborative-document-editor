from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.document import CollaboratorRole
from app.schemas.auth import UserResponse


class DocumentCreate(BaseModel):
    """Schema to create a new document."""
    title: str = Field(default="Untitled Document", max_length=255)
    content: str = Field(default="")


class DocumentUpdate(BaseModel):
    """Schema to update document metadata or content."""
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = None


class CollaboratorResponse(BaseModel):
    """Collaborator detail schema."""
    id: int
    user_id: int
    role: CollaboratorRole
    created_at: datetime
    user: UserResponse

    model_config = {"from_attributes": True}


class DocumentResponse(BaseModel):
    """Summary document schema for dashboard listing."""
    id: int
    title: str
    version: int
    owner_id: int
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    user_role: Optional[CollaboratorRole] = None

    model_config = {"from_attributes": True}


class DocumentDetailResponse(BaseModel):
    """Full document schema including content and collaborators."""
    id: int
    title: str
    content: str
    version: int
    owner_id: int
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    user_role: Optional[CollaboratorRole] = None
    owner: UserResponse
    collaborators: List[CollaboratorResponse] = []

    model_config = {"from_attributes": True}


class CollaboratorAddRequest(BaseModel):
    """Schema to invite a collaborator by email."""
    email: str
    role: CollaboratorRole = CollaboratorRole.EDITOR


class SnapshotCreate(BaseModel):
    """Schema to manually create a snapshot checkpoint."""
    comment: Optional[str] = Field(None, max_length=255)


class SnapshotResponse(BaseModel):
    """Snapshot representation."""
    id: int
    document_id: int
    version: int
    content: str
    created_by_id: Optional[int]
    comment: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class OperationPayload(BaseModel):
    """Realtime operation schema for sync."""
    op_type: str = Field(..., pattern="^(insert|delete|replace)$")
    position: int = Field(..., ge=0)
    text: Optional[str] = None
    length: int = Field(default=0, ge=0)
    client_id: str
    client_version: int = Field(..., ge=0)


class SyncInitResponse(BaseModel):
    """Initial payload sent to client on WebSocket connection."""
    document_id: int
    title: str
    content: str
    version: int
    user_role: CollaboratorRole
    active_users: List[dict] = []
