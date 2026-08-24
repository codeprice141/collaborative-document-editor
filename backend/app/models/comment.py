from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class DocumentComment(Base):
    """Inline contextual comment on document text."""
    __tablename__ = "document_comments"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(
        Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    selected_text = Column(String(500), nullable=True)
    anchor_range = Column(String(255), nullable=True)  # start:end or node reference
    content = Column(Text, nullable=False)
    is_resolved = Column(Boolean, default=False, nullable=False)
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
    document = relationship("Document", backref="comments")
    user = relationship("User")
    replies = relationship(
        "DocumentCommentReply",
        back_populates="comment",
        cascade="all, delete-orphan",
        order_by="DocumentCommentReply.created_at.asc()"
    )


class DocumentCommentReply(Base):
    """Threaded reply to a document comment."""
    __tablename__ = "document_comment_replies"

    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(
        Integer, ForeignKey("document_comments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    content = Column(Text, nullable=False)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    comment = relationship("DocumentComment", back_populates="replies")
    user = relationship("User")
