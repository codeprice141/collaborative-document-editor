from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.document import CollaboratorRole
from app.services.document_service import DocumentService
from app.services.comment_service import CommentService
from app.schemas.comment import CommentCreate, CommentResponse, CommentReplyCreate, CommentReplyResponse

router = APIRouter(prefix="/documents/{doc_id}/comments", tags=["comments"])


@router.post("", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    doc_id: int,
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = DocumentService.get_document_role(db, doc_id, current_user.id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied",
        )
    return CommentService.create_comment(db, doc_id, current_user.id, comment_in)


@router.get("", response_model=List[CommentResponse])
def list_comments(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = DocumentService.get_document_role(db, doc_id, current_user.id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied",
        )
    return CommentService.list_comments(db, doc_id)


@router.patch("/{comment_id}/resolve", response_model=CommentResponse)
def toggle_resolve_comment(
    doc_id: int,
    comment_id: int,
    is_resolved: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = DocumentService.get_document_role(db, doc_id, current_user.id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied",
        )
    updated = CommentService.resolve_comment(db, comment_id, is_resolved)
    if not updated:
        raise HTTPException(status_code=404, detail="Comment not found")
    return updated


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    doc_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    success = CommentService.delete_comment(db, comment_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete comment (either not found or you are not the author)",
        )
    return None


@router.post("/{comment_id}/replies", response_model=CommentReplyResponse, status_code=status.HTTP_201_CREATED)
def reply_to_comment(
    doc_id: int,
    comment_id: int,
    reply_in: CommentReplyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = DocumentService.get_document_role(db, doc_id, current_user.id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied",
        )
    reply = CommentService.add_reply(db, comment_id, current_user.id, reply_in)
    if not reply:
        raise HTTPException(status_code=404, detail="Comment not found")
    return reply
