from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from app.models.comment import DocumentComment, DocumentCommentReply
from app.schemas.comment import CommentCreate, CommentReplyCreate


class CommentService:
    @staticmethod
    def create_comment(
        db: Session, doc_id: int, user_id: int, comment_in: CommentCreate
    ) -> DocumentComment:
        comment = DocumentComment(
            document_id=doc_id,
            user_id=user_id,
            content=comment_in.content,
            selected_text=comment_in.selected_text,
            anchor_range=comment_in.anchor_range,
            is_resolved=False,
        )
        db.add(comment)
        db.commit()
        return (
            db.query(DocumentComment)
            .options(joinedload(DocumentComment.user))
            .filter(DocumentComment.id == comment.id)
            .first()
        )

    @staticmethod
    def list_comments(db: Session, doc_id: int, limit: int = 20, skip: int = 0) -> List[DocumentComment]:
        return (
            db.query(DocumentComment)
            .options(
                joinedload(DocumentComment.user),
                joinedload(DocumentComment.replies).joinedload(DocumentCommentReply.user),
            )
            .filter(DocumentComment.document_id == doc_id)
            .order_by(DocumentComment.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def resolve_comment(
        db: Session, comment_id: int, is_resolved: bool = True
    ) -> Optional[DocumentComment]:
        comment = (
            db.query(DocumentComment)
            .options(
                joinedload(DocumentComment.user),
                joinedload(DocumentComment.replies).joinedload(DocumentCommentReply.user),
            )
            .filter(DocumentComment.id == comment_id)
            .first()
        )
        if not comment:
            return None
        comment.is_resolved = is_resolved
        comment.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(comment)
        return comment

    @staticmethod
    def delete_comment(db: Session, comment_id: int, user_id: int) -> bool:
        comment = db.query(DocumentComment).filter(DocumentComment.id == comment_id).first()
        if not comment or comment.user_id != user_id:
            return False
        db.delete(comment)
        db.commit()
        return True

    @staticmethod
    def add_reply(
        db: Session, comment_id: int, user_id: int, reply_in: CommentReplyCreate
    ) -> Optional[DocumentCommentReply]:
        comment = db.query(DocumentComment).filter(DocumentComment.id == comment_id).first()
        if not comment:
            return None
        reply = DocumentCommentReply(
            comment_id=comment_id,
            user_id=user_id,
            content=reply_in.content,
        )
        db.add(reply)
        db.commit()
        return (
            db.query(DocumentCommentReply)
            .options(joinedload(DocumentCommentReply.user))
            .filter(DocumentCommentReply.id == reply.id)
            .first()
        )
