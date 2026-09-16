import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { X, Send, MessageSquare, CornerDownRight, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { formatRelativeTime } from '../utils/date';

function Avatar({ name = '', avatarUrl = '', size = 'sm' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-[11px]' : 'w-9 h-9 text-sm';
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || 'User'}
        className={`${sz} rounded-full object-cover shrink-0 border border-border shadow-xs`}
      />
    );
  }
  const initials = name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['from-blue-400 to-blue-600','from-violet-400 to-violet-600','from-emerald-400 to-emerald-600','from-rose-400 to-rose-600','from-amber-400 to-amber-600'];
  const color = colors[(name || 'U').charCodeAt(0) % colors.length];
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials || '?'}
    </div>
  );
}

function renderCommentText(text) {
  if (!text) return '';
  const parts = text.split(/(@[a-zA-Z0-9_.\-\s]+?(?=\s|[.,!?]|$))/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return (
        <span
          key={i}
          className="inline-flex items-center font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-1 py-0.2 rounded"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

function MentionDropdown({ query, collaborators = [], onSelect }) {
  if (query === null || query === undefined || !collaborators.length) return null;
  const q = query.trim().toLowerCase();
  const matches = collaborators.filter(c => {
    if (!q) return true;
    const name = (c.full_name || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  }).slice(0, 6);

  if (!matches.length) return null;

  return (
    <div className="absolute bottom-full left-0 mb-1.5 w-full z-50 animate-in fade-in zoom-in-95">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-1">
        <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Mention Collaborator
        </div>
        {matches.map(c => (
          <button
            key={c.user_id || c.id || c.email}
            type="button"
            onMouseDown={e => { e.preventDefault(); onSelect(c); }}
            className="w-full flex items-center justify-between gap-2 px-2.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                <Avatar name={c.full_name || c.email} avatarUrl={c.avatar_url} size="sm" />
                {c.is_online && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400">
                    {c.full_name || c.email}
                  </p>
                  {c.is_online && (
                    <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.2 rounded">
                      online
                    </span>
                  )}
                </div>
                {c.email && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {c.email}
                  </p>
                )}
              </div>
            </div>
            {c.role && (
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md shrink-0">
                {c.role}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function CommentCard({ comment, currentUserId, docId, onDeleted, allCollaborators, onSendEvent }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState(comment.replies || []);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentions, setMentions] = useState([]);
  const textRef = useRef(null);
  const isOwner = comment.user_id === currentUserId;

  const insertMention = (c) => {
    const val = replyText;
    const pos = val.lastIndexOf('@');
    const name = c.full_name || c.email || 'User';
    const updated = (pos >= 0 ? val.slice(0, pos) : val) + `@${name} `;
    setReplyText(updated);
    setMentionQuery(null);
    setMentions(prev => {
      const exists = prev.some(m => (m.user_id && m.user_id === c.user_id) || (m.email && m.email === c.email));
      return exists ? prev : [...prev, c];
    });
    if (textRef.current) textRef.current.focus();
  };

  const handleInput = (e) => {
    const val = e.target.value;
    setReplyText(val);
    const at = val.lastIndexOf('@');
    if (at !== -1 && (at === 0 || /\s/.test(val[at - 1]))) {
      const q = val.slice(at + 1);
      if (q.includes('\n') || q.length > 25) {
        setMentionQuery(null);
      } else {
        setMentionQuery(q);
      }
    } else {
      setMentionQuery(null);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setLoading(true);
    try {
      const r = await api.createReply(docId, comment.id, { content: replyText.trim() });
      setReplies(prev => [...prev, r]);
      const currentMentions = [...mentions];
      setReplyText('');
      setMentions([]);
      setMentionQuery(null);
      setReplyOpen(false);
      if (onSendEvent) {
        onSendEvent({
          action: 'created',
          comment: r,
          mentioned_user_ids: currentMentions.map(m => m.user_id).filter(Boolean),
          mentioned_emails: currentMentions.map(m => m.email).filter(Boolean),
          mentioned_names: currentMentions.map(m => m.full_name || m.email),
        });
      }
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    try {
      await api.deleteComment(docId, comment.id);
      onDeleted(comment.id);
    } catch { /* silent */ }
  };

  const authorName =
    comment.user?.full_name ||
    comment.user_name ||
    comment.user?.email ||
    comment.user_email ||
    'Collaborator';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={authorName} avatarUrl={comment.user?.avatar_url || comment.sender_avatar} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {authorName}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{formatRelativeTime(comment.created_at)}</p>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={handleDelete}
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all opacity-0 group-hover:opacity-100"
            title="Delete comment"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Selected text reference */}
      {comment.selected_text && (
        <div className="flex items-start gap-1.5 mb-2.5 px-2.5 py-1.5 bg-brand-50 dark:bg-brand-950/30 border-l-2 border-brand-400 rounded-r-lg">
          <span className="text-xs text-brand-700 dark:text-brand-300 italic line-clamp-2">"{comment.selected_text}"</span>
        </div>
      )}

      {/* Content */}
      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
        {renderCommentText(comment.content)}
      </p>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-2.5 space-y-2.5">
          {(expanded ? replies : replies.slice(0, 1)).map(r => {
            const replyAuthor =
              r.user?.full_name ||
              r.user_name ||
              r.user?.email ||
              r.user_email ||
              'Collaborator';
            return (
              <div key={r.id} className="flex items-start gap-2">
                <CornerDownRight size={13} className="text-slate-300 dark:text-slate-600 mt-1 flex-shrink-0" />
                <Avatar name={replyAuthor} avatarUrl={r.user?.avatar_url || r.sender_avatar} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{replyAuthor}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatRelativeTime(r.created_at)}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 whitespace-pre-wrap">
                    {renderCommentText(r.content)}
                  </p>
                </div>
              </div>
            );
          })}
          {replies.length > 1 && (
            <button onClick={() => setExpanded(e => !e)} className="flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 ml-5">
              {expanded ? <><ChevronUp size={12} />Show less</> : <><ChevronDown size={12} />{replies.length - 1} more {replies.length - 1 === 1 ? 'reply' : 'replies'}</>}
            </button>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => setReplyOpen(o => !o)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <CornerDownRight size={12} />Reply
        </button>
      </div>

      {/* Reply Input */}
      {replyOpen && (
        <div className="mt-3 relative animate-fade-in">
          <div className="relative">
            <MentionDropdown query={mentionQuery} collaborators={allCollaborators} onSelect={insertMention} />
            <textarea
              ref={textRef}
              value={replyText}
              onChange={handleInput}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !mentionQuery) { e.preventDefault(); handleReply(); }}}
              placeholder="Write a reply... (use @ to mention)"
              rows={2}
              className="w-full text-sm pl-3 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all resize-none shadow-xs"
            />
            <button
              type="button"
              onClick={handleReply}
              disabled={!replyText.trim() || loading}
              className="absolute right-2 bottom-2 w-6 h-6 rounded-full bg-brand-600 hover:bg-brand-700 disabled:opacity-30 disabled:hover:bg-brand-600 text-white flex items-center justify-center transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
              title="Send reply"
            >
              {loading ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Send size={11} className="-ml-0.5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommentsDrawer({
  docId, currentUserId, allCollaborators = [], initialDraft = null,
  onClearDraft, onSendCommentEvent, incomingCommentEvent, onClose,
}) {
  const PAGE_SIZE = 20;
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState(initialDraft?.selectedText ? '' : '');
  const [selectedText, setSelectedText] = useState(initialDraft?.selectedText || '');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentions, setMentions] = useState([]);
  const textRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (initialDraft?.selectedText) {
      setSelectedText(initialDraft.selectedText);
      textRef.current?.focus();
      if (onClearDraft) onClearDraft();
    }
  }, [initialDraft]);

  // Initial load - fetch newest 20 comments
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getComments(docId, PAGE_SIZE, 0)
      .then(data => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : [];
        setComments(list);
        setHasMore(list.length >= PAGE_SIZE);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [docId]);

  // Load more older comments (pagination)
  const loadMoreComments = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const olderData = await api.getComments(docId, PAGE_SIZE, comments.length);
      if (olderData && olderData.length > 0) {
        setComments(prev => {
          const seen = new Set(prev.map(c => c.id));
          const uniqueOlder = olderData.filter(c => !seen.has(c.id));
          return [...prev, ...uniqueOlder];
        });
        if (olderData.length < PAGE_SIZE) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch {
      // keep hasMore on error
    } finally {
      setLoadingMore(false);
    }
  }, [docId, comments.length, loadingMore, hasMore]);

  // Infinite scroll observer for loading older comments
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreComments();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadMoreComments]);

  useEffect(() => {
    if (incomingCommentEvent?.action === 'created' && incomingCommentEvent.comment) {
      const c = incomingCommentEvent.comment;
      if (c.parent_comment_id) {
        setComments(prev => prev.map(cm => cm.id === c.parent_comment_id ? { ...cm, replies: [...(cm.replies || []), c] } : cm));
      } else {
        // Prepend newest comment to top
        setComments(prev => [c, ...prev.filter(item => item.id !== c.id)]);
      }
    }
  }, [incomingCommentEvent]);

  const insertMention = (c) => {
    const val = newComment;
    const pos = val.lastIndexOf('@');
    const name = c.full_name || c.email || 'User';
    setNewComment((pos >= 0 ? val.slice(0, pos) : val) + `@${name} `);
    setMentionQuery(null);
    setMentions(prev => {
      const exists = prev.some(m => (m.user_id && m.user_id === c.user_id) || (m.email && m.email === c.email));
      return exists ? prev : [...prev, c];
    });
    textRef.current?.focus();
  };

  const handleInput = (e) => {
    const val = e.target.value;
    setNewComment(val);
    const at = val.lastIndexOf('@');
    if (at !== -1 && (at === 0 || /\s/.test(val[at - 1]))) {
      const q = val.slice(at + 1);
      if (q.includes('\n') || q.length > 25) {
        setMentionQuery(null);
      } else {
        setMentionQuery(q);
      }
    } else {
      setMentionQuery(null);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const c = await api.createComment(docId, {
        content: newComment.trim(),
        selected_text: selectedText || null,
      });
      // Prepend newest comment to top
      setComments(prev => [c, ...prev.filter(item => item.id !== c.id)]);
      const currentMentions = [...mentions];
      setNewComment('');
      setSelectedText('');
      setMentions([]);
      setMentionQuery(null);
      if (onSendCommentEvent) {
        onSendCommentEvent({
          action: 'created',
          comment: c,
          mentioned_user_ids: currentMentions.map(m => m.user_id).filter(Boolean),
          mentioned_emails: currentMentions.map(m => m.email).filter(Boolean),
          mentioned_names: currentMentions.map(m => m.full_name || m.email),
        });
      }
    } catch { /* silent */ } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-elevated flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare size={17} className="text-brand-600 dark:text-brand-400" />
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Comments</h2>
          {comments.length > 0 && (
            <span className="text-xs font-bold bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-full">
              {comments.length}{hasMore ? '+' : ''}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <X size={17} />
        </button>
      </div>

      {/* New Comment Input (WhatsApp-style inline send button) */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-200 dark:border-slate-800 relative">
        {selectedText && (
          <div className="flex items-start gap-1.5 mb-2 px-3 py-1.5 bg-brand-50 dark:bg-brand-950/30 border-l-2 border-brand-400 rounded-r-xl">
            <p className="text-xs text-brand-700 dark:text-brand-300 italic line-clamp-2 flex-1">"{selectedText}"</p>
            <button onClick={() => setSelectedText('')} className="text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 flex-shrink-0">
              <X size={12} />
            </button>
          </div>
        )}
        <div className="relative">
          <MentionDropdown query={mentionQuery} collaborators={allCollaborators} onSelect={insertMention} />
          <textarea
            ref={textRef}
            value={newComment}
            onChange={handleInput}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !mentionQuery) { e.preventDefault(); handleSubmit(); } }}
            placeholder="Write a comment... (use @ to mention)"
            rows={2}
            className="w-full text-sm pl-3.5 pr-11 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all resize-none shadow-xs"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!newComment.trim() || submitting}
            className="absolute right-2.5 bottom-2.5 w-7 h-7 rounded-full bg-brand-600 hover:bg-brand-700 disabled:opacity-30 disabled:hover:bg-brand-600 text-white flex items-center justify-center transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
            title="Send comment"
          >
            {submitting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Send size={12} className="-ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Comments List (Newest at top, Oldest at bottom) */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse h-28" />
            ))}
          </div>
        )}
        {!loading && comments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
              <MessageSquare size={22} className="text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No comments yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Start the conversation above</p>
          </div>
        )}
        <div className="group">
          {comments.map(c => (
            <div key={c.id} className="mb-3">
              <CommentCard
                comment={c}
                currentUserId={currentUserId}
                docId={docId}
                onDeleted={(id) => setComments(prev => prev.filter(x => x.id !== id))}
                allCollaborators={allCollaborators}
                onSendEvent={onSendCommentEvent}
              />
            </div>
          ))}
        </div>

        {/* Older comments pagination sentinel / loader */}
        {hasMore && !loading && (
          <div ref={sentinelRef} className="py-2 text-center">
            <button
              type="button"
              onClick={loadMoreComments}
              disabled={loadingMore}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-50 py-1 px-3"
            >
              {loadingMore && <Loader2 size={12} className="animate-spin" />}
              {loadingMore ? 'Loading older comments...' : 'Load older comments'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
