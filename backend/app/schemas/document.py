from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.document import CollaboratorRole
from app.schemas.auth import UserResponse


class DocumentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: Optional[str] = Field(default="")
    drawing_data: Optional[str] = Field(default="[]")


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = None
    drawing_data: Optional[str] = None
    is_public: Optional[bool] = None
    public_role: Optional[CollaboratorRole] = None


class DocumentCollaboratorResponse(BaseModel):
    id: int
    user_id: int
    role: CollaboratorRole
    created_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True


CollaboratorResponse = DocumentCollaboratorResponse


class CollaboratorAddRequest(BaseModel):
    email: str
    role: CollaboratorRole = CollaboratorRole.EDITOR


ShareDocumentRequest = CollaboratorAddRequest


class DocumentResponse(BaseModel):
    id: int
    title: str
    content: Optional[str] = ""
    drawing_data: Optional[str] = "[]"
    version: int
    owner_id: int
    is_archived: bool
    is_public: bool = False
    public_role: CollaboratorRole = CollaboratorRole.VIEWER
    created_at: datetime
    updated_at: datetime
    user_role: Optional[CollaboratorRole] = None
    owner: Optional[UserResponse] = None
    collaborators: List[DocumentCollaboratorResponse] = []

    class Config:
        from_attributes = True


DocumentDetailResponse = DocumentResponse


class SnapshotCreate(BaseModel):
    comment: Optional[str] = Field(None, max_length=255)


class SnapshotResponse(BaseModel):
    id: int
    document_id: int
    version: int
    content: Optional[str] = ""
    drawing_data: Optional[str] = "[]"
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OperationPayload(BaseModel):
    op_type: str
    position: int
    text: Optional[str] = None
    length: Optional[int] = None
    client_version: int


class SyncInitResponse(BaseModel):
    document_id: int
    title: str
    content: Optional[str] = ""
    drawing_data: Optional[str] = "[]"
    version: int
    user_role: str
    user_color: str
    active_users: list
