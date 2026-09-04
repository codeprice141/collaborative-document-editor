import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Plus, Search, Sun, Moon, LogOut, FileText, Users,
  Clock, Trash2, MoreHorizontal, Filter, Layers,
  AlertCircle, ChevronDown, Globe, Lock,
} from 'lucide-react';

const FILTER_OPTIONS = ['All', 'Owned', 'Shared'];

function relativeTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function DocCard({ doc, onOpen, onDelete, currentUserId }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isOwner = doc.owner_id === currentUserId || doc.user_role === 'owner';
  const initials = (doc.title || 'U').charAt(0).toUpperCase();
  const collabCount = doc.collaborators?.length || 0;

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const accentColors = [
    'from-blue-400 to-blue-600',
    'from-violet-400 to-violet-600',
    'from-emerald-400 to-emerald-600',
    'from-rose-400 to-rose-600',
    'from-amber-400 to-amber-600',
    'from-cyan-400 to-cyan-600',
  ];
  const accent = accentColors[doc.id % accentColors.length];

  return (
    <div
      className="
        group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800
        shadow-soft hover:shadow-card transition-all duration-200 cursor-pointer
        flex flex-col overflow-hidden hover:-translate-y-0.5
      "
      onClick={() => onOpen(doc.id)}
    >
      {/* Color Bar */}
      <div className={`h-1.5 bg-gradient-to-r ${accent} flex-shrink-0`} />

      <div className="p-5 flex-1 flex flex-col gap-3">
        {/* Icon + Title */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm`}>
              {initials}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm leading-tight">
                {doc.title || 'Untitled Document'}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                  isOwner
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {isOwner ? 'Owner' : (doc.user_role || 'viewer')}
                </span>
                {doc.is_public && (
                  <span className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                    <Globe size={10} />Public
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Menu */}
          {isOwner && (
            <div ref={menuRef} className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-all"
              >
                <MoreHorizontal size={15} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 z-10 w-36 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-modal overflow-hidden animate-fade-in">
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(doc.id, doc.title); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 size={14} />Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mt-auto">
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span>{relativeTime(doc.updated_at || doc.created_at)}</span>
          </div>
          {collabCount > 0 && (
            <div className="flex items-center gap-1">
              <Users size={11} />
              <span>{collabCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, title }
  const [deleting, setDeleting] = useState(false);

  const fetchDocs = async () => {
    try {
      const data = await api.getDocuments();
      setDocs(data);
    } catch (e) {
      setError(e.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const doc = await api.createDocument({ title: 'Untitled Document', content: '' });
      navigate(`/editor/${doc.id}`);
    } catch (e) {
      setError('Failed to create document');
    } finally { setCreating(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteDocument(deleteTarget.id);
      setDocs(prev => prev.filter(d => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      setError('Failed to delete document');
    } finally { setDeleting(false); }
  };

  const filtered = docs.filter(doc => {
    const matchesSearch = search === '' || (doc.title || '').toLowerCase().includes(search.toLowerCase());
    const isOwner = doc.owner_id === user?.id || doc.user_role === 'owner';
    const matchesFilter = filter === 'All' || (filter === 'Owned' && isOwner) || (filter === 'Shared' && !isOwner);
    return matchesSearch && matchesFilter;
  });

  const userInitials = (user?.full_name || user?.email || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 sm:px-6 gap-3 shadow-soft">
        {/* Brand */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
            <Layers size={17} className="text-white" />
          </div>
          <span className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight hidden sm:block">
            AetherDoc
          </span>
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative flex-1 max-w-[280px] hidden sm:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full h-9 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 dark:focus:border-brand-400 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-all"
          >
            {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
          </button>

          {/* User Avatar + Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {userInitials}
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden md:block truncate max-w-[120px]">
              {user?.full_name || user?.email || ''}
            </span>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              title="Sign out"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
              My Documents
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {docs.length} document{docs.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-70 text-white text-sm font-semibold shadow-sm transition-all flex-shrink-0"
          >
            {creating ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            ) : (
              <Plus size={17} />
            )}
            New Document
          </button>
        </div>

        {/* Mobile Search */}
        <div className="relative mb-4 sm:hidden">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full h-10 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mb-6">
          {FILTER_OPTIONS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 h-8 rounded-full text-xs font-semibold transition-all border ${
                filter === f
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-600 hover:text-brand-600 dark:hover:text-brand-400'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
            <AlertCircle size={16} className="flex-shrink-0" /><span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 h-36 animate-pulse">
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-t-2xl" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <FileText size={28} className="text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
              {search ? 'No documents found' : 'No documents yet'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-5 max-w-xs">
              {search ? `No results for "${search}"` : 'Create your first document to get started with real-time collaboration.'}
            </p>
            {!search && (
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm transition-all"
              >
                <Plus size={15} />Create First Document
              </button>
            )}
          </div>
        )}

        {/* Doc Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(doc => (
              <DocCard
                key={doc.id}
                doc={doc}
                onOpen={(id) => navigate(`/editor/${id}`)}
                onDelete={(id, title) => setDeleteTarget({ id, title })}
                currentUserId={user?.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 dark:bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-modal p-6 max-w-sm w-full animate-slide-up">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-center text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Delete Document?</h3>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">
              "<span className="font-semibold text-slate-700 dark:text-slate-300">{deleteTarget.title}</span>" will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold transition-all shadow-sm flex items-center justify-center"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
