import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Share2, Link, Globe, Lock, Copy, UserPlus, Check, Trash2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const ROLE_OPTIONS = ['viewer', 'editor'];

function UserAvatar({ name = '', email = '' }) {
  const displayName = name || email || 'User';
  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <Avatar className="h-8 w-8 shrink-0">
      <AvatarFallback className="bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 text-xs font-bold">
        {initials || 'U'}
      </AvatarFallback>
    </Avatar>
  );
}

function normalizeCollabs(list) {
  return (list || []).map(c => ({
    id: c.id,
    user_id: c.user_id || c.user?.id || c.id,
    role: (c.role || 'viewer').toLowerCase(),
    full_name: c.full_name || c.user?.full_name || c.email || c.user?.email || 'Collaborator',
    email: c.email || c.user?.email || '',
  }));
}

export default function ShareModal({
  docId,
  isPublic,
  publicRole,
  collaborators: initialCollabs = [],
  onClose,
  onShared,
}) {
  const [collaborators, setCollaborators] = useState(() => normalizeCollabs(initialCollabs));
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [isPublicState, setIsPublicState] = useState(!!isPublic);
  const [publicRoleState, setPublicRoleState] = useState(publicRole || 'viewer');
  const [copied, setCopied] = useState(false);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    async function loadFreshCollabs() {
      try {
        const doc = await api.getDocument(docId);
        if (doc && doc.collaborators) {
          setCollaborators(normalizeCollabs(doc.collaborators));
        }
        if (doc && doc.public_role) {
          setPublicRoleState(doc.public_role);
        }
        if (doc && typeof doc.is_public === 'boolean') {
          setIsPublicState(doc.is_public);
        }
      } catch (err) {
        console.error('Failed to load fresh collaborators:', err);
      }
    }
    loadFreshCollabs();
  }, [docId]);

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
      const newCollab = {
        id: updated.user_id || updated.id,
        user_id: updated.user_id,
        role: updated.role || inviteRole,
        full_name: updated.user?.full_name || inviteEmail.trim(),
        email: updated.user?.email || inviteEmail.trim(),
      };
      setCollaborators(prev => {
        const filtered = prev.filter(c => c.email !== newCollab.email && c.id !== newCollab.id);
        return [...filtered, newCollab];
      });
      setInviteEmail('');
      onShared?.();
    } catch (e) {
      setInviteError(e.message || 'Could not find user with that email');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId) => {
    setRemoving(userId);
    try {
      await api.removeCollaborator(docId, userId);
      setCollaborators(prev => prev.filter(c => c.id !== userId && c.user_id !== userId));
      onShared?.();
    } catch {
      /* silent */
    } finally {
      setRemoving(null);
    }
  };

  const handleTogglePublic = async () => {
    const next = !isPublicState;
    setIsPublicState(next);
    try {
      await api.updateDocument(docId, { is_public: next, public_role: publicRoleState });
      onShared?.();
    } catch {
      setIsPublicState(!next);
    }
  };

  const handlePublicRoleChange = async (newRole) => {
    setPublicRoleState(newRole);
    try {
      await api.updateDocument(docId, { is_public: isPublicState, public_role: newRole });
      onShared?.();
    } catch (e) {
      console.error('Failed to update public role:', e);
    }
  };

  const handleChangeRole = async (email, newRole) => {
    try {
      await api.addCollaborator(docId, email, newRole);
      setCollaborators(prev => prev.map(c => (c.email === email ? { ...c, role: newRole } : c)));
      onShared?.();
    } catch (e) {
      console.error('Failed to change collaborator role:', e);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose?.(); }}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border text-left">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Share2 size={16} />
            </div>
            <DialogTitle className="text-base">Share Document</DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Copy Link */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Document Link
            </label>
            <div className="flex gap-2">
              <div className="flex-1 h-10 flex items-center px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-input overflow-hidden">
                <Link size={13} className="text-muted-foreground shrink-0 mr-2" />
                <span className="text-xs text-muted-foreground truncate">{shareUrl}</span>
              </div>
              <Button
                variant={copied ? 'default' : 'outline'}
                size="sm"
                onClick={handleCopy}
                className={`shrink-0 h-10 px-3.5 gap-1.5 ${copied ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
              >
                {copied ? <><Check size={14} />Copied</> : <><Copy size={14} />Copy</>}
              </Button>
            </div>
          </div>

          {/* Public Access Toggle */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isPublicState
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isPublicState ? <Globe size={16} /> : <Lock size={16} />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {isPublicState ? 'Public Link' : 'Private'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPublicState ? 'Anyone with the link can access' : 'Only invited collaborators'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTogglePublic}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                  isPublicState ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    isPublicState ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isPublicState && (
              <div className="flex items-center justify-between pt-2.5 border-t border-border text-xs">
                <span className="text-muted-foreground font-medium">Link permissions:</span>
                <select
                  value={publicRoleState}
                  onChange={e => handlePublicRoleChange(e.target.value)}
                  className="h-8 px-2.5 rounded-lg border border-input bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer"
                >
                  <option value="editor">Editor (Anyone can edit)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
              </div>
            )}
          </div>

          {/* Invite */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Invite Collaborator
            </label>
            {inviteError && (
              <p className="text-xs text-destructive">{inviteError}</p>
            )}
            <form onSubmit={handleInvite} className="flex gap-2">
              <Input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1"
              />
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                className="h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer"
              >
                {ROLE_OPTIONS.map(r => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
              <Button
                type="submit"
                disabled={!inviteEmail.trim() || inviting}
                className="gap-1.5 shrink-0"
              >
                {inviting ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
                Invite
              </Button>
            </form>
          </div>

          {/* Collaborators List */}
          {collaborators.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Collaborators ({collaborators.length})
                </label>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {collaborators.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar name={c.full_name} email={c.email} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {c.full_name || c.email}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {c.role === 'owner' ? (
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                          Owner
                        </Badge>
                      ) : (
                        <select
                          value={c.role || 'viewer'}
                          onChange={e => handleChangeRole(c.email, e.target.value)}
                          className="h-7 px-2 rounded-lg border border-input bg-background text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-500"
                        >
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      )}
                      {c.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(c.id)}
                          disabled={removing === c.id}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          {removing === c.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border-t border-border sm:justify-end">
          <Button onClick={onClose} size="sm" className="px-6">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
