from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class CollaboratorRole(str, enum.Enum):
    OWNER = "owner"
    EDITOR = "editor"
    VIEWER = "viewer"

    @classmethod
    def _missing_(cls, value):
        if value is None:
            return cls.VIEWER
        val_str = str(value).lower().strip()
        for member in cls:
            if member.value == val_str or member.name.lower() == val_str:
                return member
        return cls.VIEWER


class Document(Base):
    """Document database model."""
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, default="Untitled Document")
    content = Column(Text, nullable=False, default="")
    drawing_data = Column(Text, nullable=True, default="[]")
    version = Column(Integer, nullable=False, default=0)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False)
    is_public = Column(Boolean, default=False, nullable=False)
    public_role = Column(String(32), default=CollaboratorRole.VIEWER.value, nullable=False)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    owner = relationship("User", back_populates="owned_documents")
    collaborators = relationship(
        "DocumentCollaborator",
        back_populates="document",
        cascade="all, delete-orphan",
    )
    snapshots = relationship(
        "DocumentSnapshot", back_populates="document", cascade="all, delete-orphan"
    )
    operations = relationship(
        "DocumentOperation", back_populates="document", cascade="all, delete-orphan"
    )


class DocumentCollaborator(Base):
    """Document access and permissions per user."""
    __tablename__ = "document_collaborators"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(
        Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    role = Column(String(32), default=CollaboratorRole.EDITOR.value, nullable=False)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    document = relationship("Document", back_populates="collaborators")
    user = relationship("User", back_populates="collaborations")


class DocumentSnapshot(Base):
    """Historical document snapshot / revision checkpoint."""
    __tablename__ = "document_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(
        Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False
    )
    version = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    drawing_data = Column(Text, nullable=True, default="[]")
    created_by_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    comment = Column(String(255), nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    document = relationship("Document", back_populates="snapshots")


class DocumentOperation(Base):
    """Persistent log of sequential operations for sync & recovery."""
    __tablename__ = "document_operations"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(
        Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False
    )
    version = Column(Integer, nullable=False, index=True)
    client_id = Column(String(64), nullable=False)
    op_type = Column(String(16), nullable=False)  # "insert", "delete", "replace"
    position = Column(Integer, nullable=False)
    text = Column(Text, nullable=True)
    length = Column(Integer, default=0, nullable=False)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    document = relationship("Document", back_populates="operations")
