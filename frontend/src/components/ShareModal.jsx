import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, Share2, Link, Globe, Lock, Copy, UserPlus, Check, ChevronDown, Trash2, Loader2 } from 'lucide-react';

const ROLE_OPTIONS = ['viewer', 'editor'];

function Avatar({ name = '' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['from-blue-400 to-blue-600','from-violet-400 to-violet-600','from-emerald-400 to-emerald-600','from-rose-400 to-rose-600'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {initials || '?'}
    </div>
  );
}

export default function ShareModal({ docId, isPublic, publicRole, collaborators: initialCollabs = [], onClose, onShared }) {
  const [collaborators, setCollaborators] = useState(initialCollabs);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [isPublicState, setIsPublicState] = useState(!!isPublic);
  const [publicRoleState, setPublicRoleState] = useState(publicRole || 'viewer');
  const [copied, setCopied] = useState(false);
  const [removing, setRemoving] = useState(null);

  const shareUrl = window.location.href;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteError('');
    setInviting(true);
    try {
      const updated = await api.addCollaborator(docId, inviteEmail.trim(), inviteRole);
      setCollaborators(prev => [...prev, ...((updated.collaborators || []).filter(c => !prev.find(p => p.id === c.id)))]);
      setInviteEmail('');
      onShared?.();
    } catch (e) {
      setInviteError(e.message || 'Could not find user with that email');
    } finally { setInviting(false); }
  };

  const handleRemove = async (userId) => {
    setRemoving(userId);
    try {
      await api.removeCollaborator(docId, userId);
      setCollaborators(prev => prev.filter(c => c.id !== userId));
      onShared?.();
    } catch { /* silent */ } finally { setRemoving(null); }
  };

  const handleTogglePublic = async () => {
    const next = !isPublicState;
    setIsPublicState(next);
    try {
      await api.updateDocument(docId, { is_public: next, public_role: publicRoleState });
      onShared?.();
    } catch { setIsPublicState(!next); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 dark:bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-modal w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Share2 size={17} className="text-brand-600 dark:text-brand-400" />
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Share Document</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <X size={17} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Copy Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Document Link</label>
            <div className="flex gap-2">
              <div className="flex-1 h-10 flex items-center px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden">
                <Link size={13} className="text-slate-400 flex-shrink-0 mr-2" />
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{shareUrl}</span>
              </div>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 h-10 px-3 rounded-xl text-xs font-semibold flex-shrink-0 transition-all ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {copied ? <><Check size={13} />Copied!</> : <><Copy size={13} />Copy</>}
              </button>
            </div>
          </div>

          {/* Public Access Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isPublicState ? 'bg-emerald-100 dark:bg-emerald-950/40' : 'bg-slate-200 dark:bg-slate-700'}`}>
                {isPublicState ? <Globe size={16} className="text-emerald-600 dark:text-emerald-400" /> : <Lock size={16} className="text-slate-500 dark:text-slate-400" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {isPublicState ? 'Public link' : 'Private'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isPublicState ? 'Anyone with the link can access' : 'Only invited collaborators'}
                </p>
              </div>
            </div>
            <button
              onClick={handleTogglePublic}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${isPublicState ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isPublicState ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Invite */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Invite Collaborator</label>
            {inviteError && (
              <p className="text-xs text-red-600 dark:text-red-400 mb-2">{inviteError}</p>
            )}
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="Email address..."
                className="flex-1 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
              />
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                className="h-10 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
              >
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
              <button
                type="submit"
                disabled={!inviteEmail.trim() || inviting}
                className="h-10 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 transition-all shadow-sm"
              >
                {inviting ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
                {inviting ? '' : 'Invite'}
              </button>
            </form>
          </div>

          {/* Collaborators List */}
          {collaborators.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Collaborators ({collaborators.length})
              </label>
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {collaborators.map(c => (
                  <div key={c.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={c.full_name || c.email || ''} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{c.full_name || c.email}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{c.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        c.role === 'owner' ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' :
                        c.role === 'editor' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                        'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                      }`}>
                        {c.role || 'viewer'}
                      </span>
                      {c.role !== 'owner' && (
                        <button
                          onClick={() => handleRemove(c.id)}
                          disabled={removing === c.id}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all disabled:opacity-40"
                        >
                          {removing === c.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="h-9 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-all shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
