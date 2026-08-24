from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.document import CollaboratorRole, Document
from app.schemas.document import (
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
    DocumentDetailResponse,
    CollaboratorAddRequest,
    CollaboratorResponse,
    SnapshotCreate,
    SnapshotResponse,
)
from app.services.document_service import DocumentService
from app.services.auth_service import AuthService

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/", response_model=DocumentDetailResponse, status_code=status.HTTP_201_CREATED)
def create_document(
    doc_in: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Creates a new collaborative document."""
    doc = DocumentService.create_document(db, current_user.id, doc_in)
    return {
        "id": doc.id,
        "title": doc.title,
        "content": doc.content,
        "version": doc.version,
        "owner_id": doc.owner_id,
        "is_archived": doc.is_archived,
        "created_at": doc.created_at,
        "updated_at": doc.updated_at,
        "user_role": CollaboratorRole.OWNER,
        "owner": current_user,
        "collaborators": doc.collaborators,
    }


@router.get("/", response_model=List[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lists all documents owned or shared with the current user."""
    docs_and_roles = DocumentService.list_user_documents(db, current_user.id)
    response = []
    for doc, role in docs_and_roles:
        response.append(
            {
                "id": doc.id,
                "title": doc.title,
                "version": doc.version,
                "owner_id": doc.owner_id,
                "is_archived": doc.is_archived,
                "created_at": doc.created_at,
                "updated_at": doc.updated_at,
                "user_role": role,
            }
        )
    return response


@router.get("/{doc_id}", response_model=DocumentDetailResponse)
def get_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves document content and details if permitted."""
    doc, role = DocumentService.get_document_with_access(db, doc_id, current_user.id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied.",
        )
    return {
        "id": doc.id,
        "title": doc.title,
        "content": doc.content,
        "version": doc.version,
        "owner_id": doc.owner_id,
        "is_archived": doc.is_archived,
        "created_at": doc.created_at,
        "updated_at": doc.updated_at,
        "user_role": role,
        "owner": doc.owner,
        "collaborators": doc.collaborators,
    }


@router.put("/{doc_id}", response_model=DocumentResponse)
def update_document(
    doc_id: int,
    update_in: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Updates document title or content (requires EDITOR or OWNER role)."""
    doc, role = DocumentService.get_document_with_access(db, doc_id, current_user.id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied.",
        )
    if role == CollaboratorRole.VIEWER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Viewers cannot edit document.",
        )
    updated_doc = DocumentService.update_document(db, doc, update_in)
    return {
        "id": updated_doc.id,
        "title": updated_doc.title,
        "version": updated_doc.version,
        "owner_id": updated_doc.owner_id,
        "is_archived": updated_doc.is_archived,
        "created_at": updated_doc.created_at,
        "updated_at": updated_doc.updated_at,
        "user_role": role,
    }


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deletes/archives a document (requires OWNER role)."""
    doc, role = DocumentService.get_document_with_access(db, doc_id, current_user.id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied.",
        )
    if role != CollaboratorRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only document owner can delete this document.",
        )
    DocumentService.delete_document(db, doc)
    return None


@router.post("/{doc_id}/share", response_model=CollaboratorResponse)
def share_document(
    doc_id: int,
    share_in: CollaboratorAddRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Shares a document with another user by email (requires OWNER role)."""
    doc, role = DocumentService.get_document_with_access(db, doc_id, current_user.id)
    if not doc or role != CollaboratorRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only document owner can manage collaborators.",
        )

    target_user = AuthService.get_by_email(db, share_in.email)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email {share_in.email} not found.",
        )

    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Owner already has full access.",
        )

    collab = DocumentService.add_or_update_collaborator(
        db, doc_id, target_user.id, share_in.role
    )
    return collab


@router.delete("/{doc_id}/collaborators/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_collaborator(
    doc_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Removes a collaborator from the document (requires OWNER role)."""
    doc, role = DocumentService.get_document_with_access(db, doc_id, current_user.id)
    if not doc or role != CollaboratorRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only document owner can remove collaborators.",
        )
    success = DocumentService.remove_collaborator(db, doc_id, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collaborator not found.",
        )
    return None


@router.post("/{doc_id}/snapshots", response_model=SnapshotResponse, status_code=status.HTTP_201_CREATED)
def create_snapshot(
    doc_id: int,
    snap_in: SnapshotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Creates a snapshot checkpoint of the document."""
    doc, role = DocumentService.get_document_with_access(db, doc_id, current_user.id)
    if not doc or role == CollaboratorRole.VIEWER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied to create snapshots.",
        )
    snapshot = DocumentService.create_snapshot(db, doc_id, current_user.id, snap_in.comment)
    return snapshot


@router.get("/{doc_id}/revisions", response_model=List[SnapshotResponse])
def list_revisions(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lists revision history for the document."""
    doc, role = DocumentService.get_document_with_access(db, doc_id, current_user.id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )
    return DocumentService.list_snapshots(db, doc_id)


@router.post("/{doc_id}/rollback/{snapshot_id}", response_model=DocumentDetailResponse)
def rollback_document(
    doc_id: int,
    snapshot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Rolls back the document to a previous snapshot (requires OWNER role)."""
    doc, role = DocumentService.get_document_with_access(db, doc_id, current_user.id)
    if not doc or role != CollaboratorRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only document owner can restore snapshots.",
        )
    restored = DocumentService.rollback_to_snapshot(db, doc, snapshot_id)
    if not restored:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Snapshot not found.",
        )
    return {
        "id": restored.id,
        "title": restored.title,
        "content": restored.content,
        "version": restored.version,
        "owner_id": restored.owner_id,
        "is_archived": restored.is_archived,
        "created_at": restored.created_at,
        "updated_at": restored.updated_at,
        "user_role": role,
        "owner": restored.owner,
        "collaborators": restored.collaborators,
    }
