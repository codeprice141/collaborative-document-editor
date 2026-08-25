from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.document import (
    Document,
    DocumentCollaborator,
    DocumentSnapshot,
    DocumentOperation,
    CollaboratorRole,
)
from app.schemas.document import DocumentCreate, DocumentUpdate


class DocumentService:
    """Service layer handling document CRUD, access management, snapshots, and revision operations."""

    @staticmethod
    def create_document(db: Session, owner_id: int, doc_in: DocumentCreate) -> Document:
        doc = Document(
            title=doc_in.title,
            content=doc_in.content or "",
            drawing_data=doc_in.drawing_data or "[]",
            owner_id=owner_id,
            version=0,
            is_public=False,
            public_role=CollaboratorRole.VIEWER.value,
        )
        db.add(doc)
        db.flush()

        # Add owner to collaborators table
        owner_collab = DocumentCollaborator(
            document_id=doc.id,
            user_id=owner_id,
            role=CollaboratorRole.OWNER.value,
        )
        db.add(owner_collab)

        # Create initial snapshot checkpoint (v0)
        snapshot = DocumentSnapshot(
            document_id=doc.id,
            version=0,
            content=doc.content,
            drawing_data=doc.drawing_data,
            created_by_id=owner_id,
            comment="Initial document creation",
        )
        db.add(snapshot)

        db.commit()
        db.refresh(doc)
        return doc

    @staticmethod
    def get_document_role(
        db: Session, doc_id: int, user_id: int
    ) -> Optional[CollaboratorRole]:
        """Returns the highest role the user has for the document, or None if no access."""
        doc = db.query(Document).filter(Document.id == doc_id, Document.is_archived == False).first()
        if not doc:
            return None
        if doc.owner_id == user_id:
            return CollaboratorRole.OWNER

        collab = (
            db.query(DocumentCollaborator)
            .filter(
                DocumentCollaborator.document_id == doc_id,
                DocumentCollaborator.user_id == user_id,
            )
            .first()
        )
        if collab:
            return CollaboratorRole(collab.role)
        
        # Check public link access
        if doc.is_public:
            return CollaboratorRole(doc.public_role)

        return None

    @classmethod
    def get_document_with_access(
        cls, db: Session, doc_id: int, user_id: int
    ) -> Tuple[Optional[Document], Optional[CollaboratorRole]]:
        role = cls.get_document_role(db, doc_id, user_id)
        if not role:
            return None, None
        doc = db.query(Document).filter(Document.id == doc_id).first()
        return doc, role

    @staticmethod
    def list_user_documents(db: Session, user_id: int) -> List[Tuple[Document, CollaboratorRole]]:
        """Lists all documents owned by user or shared with user."""
        collabs = (
            db.query(DocumentCollaborator)
            .join(Document, DocumentCollaborator.document_id == Document.id)
            .filter(
                DocumentCollaborator.user_id == user_id,
                Document.is_archived == False,
            )
            .order_by(Document.updated_at.desc())
            .all()
        )
        result = []
        for c in collabs:
            result.append((c.document, CollaboratorRole(c.role)))
        return result

    @staticmethod
    def update_document(
        db: Session, doc: Document, update_in: DocumentUpdate
    ) -> Document:
        if update_in.title is not None:
            doc.title = update_in.title
        if update_in.content is not None:
            doc.content = update_in.content
        if update_in.drawing_data is not None:
            doc.drawing_data = update_in.drawing_data
        if update_in.is_public is not None:
            doc.is_public = update_in.is_public
        if update_in.public_role is not None:
            doc.public_role = CollaboratorRole(update_in.public_role).value
        doc.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(doc)
        return doc

    @staticmethod
    def delete_document(db: Session, doc: Document) -> None:
        """Soft-deletes/archives the document."""
        doc.is_archived = True
        doc.updated_at = datetime.now(timezone.utc)
        db.commit()

    @staticmethod
    def add_or_update_collaborator(
        db: Session, doc_id: int, user_id: int, role: str
    ) -> DocumentCollaborator:
        role_enum = CollaboratorRole(role)
        collab = (
            db.query(DocumentCollaborator)
            .filter(
                DocumentCollaborator.document_id == doc_id,
                DocumentCollaborator.user_id == user_id,
            )
            .first()
        )
        if collab:
            collab.role = role_enum.value
        else:
            collab = DocumentCollaborator(
                document_id=doc_id, user_id=user_id, role=role_enum.value
            )
            db.add(collab)
        db.commit()
        db.refresh(collab)
        return collab

    @staticmethod
    def remove_collaborator(db: Session, doc_id: int, user_id: int) -> bool:
        collab = (
            db.query(DocumentCollaborator)
            .filter(
                DocumentCollaborator.document_id == doc_id,
                DocumentCollaborator.user_id == user_id,
            )
            .first()
        )
        if collab:
            db.delete(collab)
            db.commit()
            return True
        return False

    @staticmethod
    def create_snapshot(
        db: Session, doc_id: int, user_id: int, comment: Optional[str] = None
    ) -> DocumentSnapshot:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        snapshot = DocumentSnapshot(
            document_id=doc.id,
            version=doc.version,
            content=doc.content,
            drawing_data=doc.drawing_data,
            created_by_id=user_id,
            comment=comment or f"Version {doc.version} checkpoint",
        )
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)
        return snapshot

    @staticmethod
    def list_snapshots(db: Session, doc_id: int) -> List[DocumentSnapshot]:
        return (
            db.query(DocumentSnapshot)
            .filter(DocumentSnapshot.document_id == doc_id)
            .order_by(DocumentSnapshot.created_at.desc())
            .all()
        )

    @staticmethod
    def rollback_to_snapshot(
        db: Session, doc: Document, snapshot_id: int
    ) -> Optional[Document]:
        snapshot = (
            db.query(DocumentSnapshot)
            .filter(
                DocumentSnapshot.id == snapshot_id,
                DocumentSnapshot.document_id == doc.id,
            )
            .first()
        )
        if not snapshot:
            return None
        doc.content = snapshot.content
        doc.drawing_data = snapshot.drawing_data or "[]"
        doc.version = doc.version + 1
        doc.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(doc)
        return doc
