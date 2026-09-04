import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { X, Send, MessageSquare, AtSign, CornerDownRight, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

function relativeTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Avatar({ name = '', size = 'sm' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['from-blue-400 to-blue-600','from-violet-400 to-violet-600','from-emerald-400 to-emerald-600','from-rose-400 to-rose-600','from-amber-400 to-amber-600'];
  const color = colors[name.charCodeAt(0) % colors.length];
  const sz = size === 'sm' ? 'w-7 h-7 text-[11px]' : 'w-9 h-9 text-sm';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials || '?'}
    </div>
  );
}

function MentionDropdown({ query, collaborators, onSelect }) {
  if (!query || !collaborators.length) return null;
  const matches = collaborators.filter(c =>
    (c.email || '').toLowerCase().includes(query.toLowerCase()) ||
    (c.full_name || '').toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);
  if (!matches.length) return null;

  return (
    <div className="absolute bottom-full left-0 mb-1 w-full z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-elevated overflow-hidden">
        {matches.map(c => (
          <button
            key={c.id}
            onMouseDown={e => { e.preventDefault(); onSelect(c); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
          >
            <Avatar name={c.full_name || c.email} size="sm" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{c.full_name || c.email}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{c.email}</p>
            </div>
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
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentions, setMentions] = useState([]);
  const textRef = useRef(null);
  const isOwner = comment.user_id === currentUserId;

  const insertMention = (c) => {
    const val = replyText;
    const pos = val.lastIndexOf('@');
    const name = c.full_name || c.email;
    const updated = val.slice(0, pos) + `@${name} `;
    setReplyText(updated);
    setMentionQuery('');
    setMentions(prev => [...prev, c]);
    if (textRef.current) textRef.current.focus();
  };

  const handleInput = (e) => {
    const val = e.target.value;
    setReplyText(val);
    const at = val.lastIndexOf('@');
    if (at !== -1 && (at === 0 || /\s/.test(val[at - 1]))) {
      setMentionQuery(val.slice(at + 1));
    } else {
      setMentionQuery('');
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setLoading(true);
    try {
      const r = await api.createReply(docId, comment.id, { content: replyText.trim() });
      setReplies(prev => [...prev, r]);
      setReplyText('');
      setMentions([]);
      setReplyOpen(false);
      if (onSendEvent) {
        onSendEvent({ action: 'created', comment: r, mentioned_emails: mentions.map(m => m.email), mentioned_names: mentions.map(m => m.full_name) });
      }
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    try {
      await api.deleteComment(docId, comment.id);
      onDeleted(comment.id);
    } catch { /* silent */ }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={comment.user_name || comment.user_email || 'U'} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {comment.user_name || comment.user_email || 'User'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{relativeTime(comment.created_at)}</p>
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
      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{comment.content}</p>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-2.5 space-y-2.5">
          {(expanded ? replies : replies.slice(0, 1)).map(r => (
            <div key={r.id} className="flex items-start gap-2">
              <CornerDownRight size={13} className="text-slate-300 dark:text-slate-600 mt-1 flex-shrink-0" />
              <Avatar name={r.user_name || 'U'} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{r.user_name || 'User'}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{relativeTime(r.created_at)}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{r.content}</p>
              </div>
            </div>
          ))}
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
          <MentionDropdown query={mentionQuery} collaborators={allCollaborators} onSelect={insertMention} />
          <div className="flex gap-2">
            <textarea
              ref={textRef}
              value={replyText}
              onChange={handleInput}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !mentionQuery) { e.preventDefault(); handleReply(); }}}
              placeholder="Write a reply... use @ to mention"
              rows={2}
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all resize-none"
            />
            <button
              onClick={handleReply}
              disabled={!replyText.trim() || loading}
              className="h-10 w-10 flex-shrink-0 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white flex items-center justify-center transition-all shadow-sm self-end"
            >
              <Send size={14} />
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
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState(initialDraft?.selectedText ? '' : '');
  const [selectedText, setSelectedText] = useState(initialDraft?.selectedText || '');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentions, setMentions] = useState([]);
  const textRef = useRef(null);

  useEffect(() => {
    if (initialDraft?.selectedText) {
      setSelectedText(initialDraft.selectedText);
      textRef.current?.focus();
      if (onClearDraft) onClearDraft();
    }
  }, [initialDraft]);

  useEffect(() => {
    api.getComments(docId).then(data => setComments(data)).catch(() => {}).finally(() => setLoading(false));
  }, [docId]);

  useEffect(() => {
    if (incomingCommentEvent?.action === 'created' && incomingCommentEvent.comment) {
      const c = incomingCommentEvent.comment;
      if (c.parent_comment_id) {
        setComments(prev => prev.map(cm => cm.id === c.parent_comment_id ? { ...cm, replies: [...(cm.replies || []), c] } : cm));
      } else {
        setComments(prev => [c, ...prev]);
      }
    }
  }, [incomingCommentEvent]);

  const insertMention = (c) => {
    const val = newComment;
    const pos = val.lastIndexOf('@');
    const name = c.full_name || c.email;
    setNewComment(val.slice(0, pos) + `@${name} `);
    setMentionQuery('');
    setMentions(prev => [...prev, c]);
    textRef.current?.focus();
  };

  const handleInput = (e) => {
    const val = e.target.value;
    setNewComment(val);
    const at = val.lastIndexOf('@');
    if (at !== -1 && (at === 0 || /\s/.test(val[at - 1]))) {
      setMentionQuery(val.slice(at + 1));
    } else {
      setMentionQuery('');
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const c = await api.createComment(docId, {
        content: newComment.trim(),
        selected_text: selectedText || null,
      });
      setComments(prev => [c, ...prev]);
      setNewComment('');
      setSelectedText('');
      setMentions([]);
      if (onSendCommentEvent) {
        onSendCommentEvent({ action: 'created', comment: c, mentioned_emails: mentions.map(m => m.email), mentioned_names: mentions.map(m => m.full_name) });
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
              {comments.length}
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

      {/* New Comment Input */}
      <div className="flex-shrink-0 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 relative">
        {selectedText && (
          <div className="flex items-start gap-1.5 mb-2.5 px-3 py-2 bg-brand-50 dark:bg-brand-950/30 border-l-2 border-brand-400 rounded-r-xl">
            <p className="text-xs text-brand-700 dark:text-brand-300 italic line-clamp-2 flex-1">"{selectedText}"</p>
            <button onClick={() => setSelectedText('')} className="text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 flex-shrink-0">
              <X size={12} />
            </button>
          </div>
        )}
        <MentionDropdown query={mentionQuery} collaborators={allCollaborators} onSelect={insertMention} />
        <textarea
          ref={textRef}
          value={newComment}
          onChange={handleInput}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !mentionQuery) { e.preventDefault(); handleSubmit(); } }}
          placeholder="Add a comment... use @ to mention"
          rows={3}
          className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <AtSign size={11} />mention a collaborator
          </p>
          <button
            onClick={handleSubmit}
            disabled={!newComment.trim() || submitting}
            className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-sm"
          >
            <Send size={13} />
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>

      {/* Comments List */}
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
      </div>
    </div>
  );
}
