import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, History, RotateCcw, ChevronRight, Clock, User, Loader2, AlertCircle } from 'lucide-react';

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

export default function RevisionHistoryDrawer({ docId, isOwner, onClose, onRollback }) {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    api.getRevisions(docId)
      .then(data => setRevisions(Array.isArray(data) ? data : data.revisions || []))
      .catch(e => setError(e.message || 'Failed to load history'))
      .finally(() => setLoading(false));
  }, [docId]);

  const handleRollback = async (revision) => {
    setRolling(true);
    try {
      await api.rollbackRevision(docId, revision.id);
      setConfirming(null);
      onRollback?.();
    } catch (e) {
      setError(e.message || 'Rollback failed');
    } finally { setRolling(false); }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-elevated flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <History size={17} className="text-brand-600 dark:text-brand-400" />
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Version History</h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <X size={17} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-3 py-2.5 mb-4 text-sm">
            <AlertCircle size={14} /><span>{error}</span>
          </div>
        )}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-brand-500" />
          </div>
        )}
        {!loading && revisions.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
              <History size={22} className="text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No history yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Changes will appear here as you edit</p>
          </div>
        )}
        {!loading && revisions.length > 0 && (
          <div className="relative">
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="space-y-1">
              {revisions.map((r, idx) => (
                <div key={r.id} className="relative">
                  {/* Timeline dot */}
                  <div className={`absolute left-[13px] top-4 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 z-10 ${idx === 0 ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'}`} />

                  <button
                    onClick={() => setSelected(selected?.id === r.id ? null : r)}
                    className={`w-full text-left pl-10 pr-3 py-3.5 rounded-xl transition-all ${
                      selected?.id === r.id
                        ? 'bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {idx === 0 ? 'Current version' : `Version ${revisions.length - idx}`}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <Clock size={10} />{relativeTime(r.created_at)}
                          </span>
                          {r.user_name && (
                            <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <User size={10} />{r.user_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={14} className={`text-slate-400 flex-shrink-0 transition-transform ${selected?.id === r.id ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  {/* Expanded preview */}
                  {selected?.id === r.id && (
                    <div className="pl-10 pr-3 pb-3 animate-fade-in">
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 mb-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">Content preview:</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-4 font-mono">
                          {r.content ? r.content.replace(/<[^>]+>/g, ' ').trim() || '(empty)' : '(empty)'}
                        </p>
                      </div>
                      {isOwner && idx !== 0 && (
                        <button
                          onClick={() => setConfirming(r)}
                          className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-all"
                        >
                          <RotateCcw size={13} />Restore this version
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Rollback Modal */}
      {confirming && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-modal p-6 w-full max-w-sm animate-slide-up">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center mx-auto mb-4">
              <RotateCcw size={22} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-center text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Restore Version?</h3>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-5">
              This will replace the current document content with the selected version.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirming(null)} className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                Cancel
              </button>
              <button
                onClick={() => handleRollback(confirming)}
                disabled={rolling}
                className="flex-1 h-10 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-semibold transition-all shadow-sm flex items-center justify-center"
              >
                {rolling ? 'Restoring...' : 'Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
