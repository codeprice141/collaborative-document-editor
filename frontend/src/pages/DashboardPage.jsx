import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ConfirmModal from '../components/ConfirmModal';
import {
  Plus,
  Search,
  FileText,
  Users,
  Clock,
  Trash2,
  MoreHorizontal,
  AlertCircle,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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
  const isOwner = doc.owner_id === currentUserId || doc.user_role === 'owner';
  const collabCount = doc.collaborators?.length || 0;

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card hover:border-foreground/20 hover:shadow-md transition-all duration-200"
      onClick={() => onOpen(doc.id)}
    >
      <CardContent className="p-5 flex flex-col justify-between h-[150px]">
        {/* Title & Icon Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-foreground/70 group-hover:text-foreground shrink-0 transition-colors mt-0.5">
              <FileText size={15} strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate text-sm leading-tight group-hover:text-primary transition-colors">
                {doc.title || 'Untitled Document'}
              </h3>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center text-[11px] font-medium text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 mr-1.5" />
                  {isOwner ? 'Owner' : doc.user_role || 'viewer'}
                </span>
                {doc.is_public && (
                  <span className="inline-flex items-center text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                    Public
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Menu */}
          {isOwner && (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground"
                  >
                    <MoreHorizontal size={15} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem
                    onClick={() => onOpen(doc.id)}
                    className="cursor-pointer gap-2 text-xs"
                  >
                    <ExternalLink size={13} /> Open
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(doc.id, doc.title)}
                    className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 size={13} /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-2.5">
          <div className="flex items-center gap-1.5">
            <Clock size={12} strokeWidth={1.75} />
            <span>Updated {relativeTime(doc.updated_at || doc.created_at)}</span>
          </div>
          {collabCount > 0 && (
            <div className="flex items-center gap-1">
              <Users size={12} strokeWidth={1.75} />
              <span>{collabCount}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
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

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const doc = await api.createDocument({ title: 'Untitled Document', content: '' });
      navigate(`/editor/${doc.id}`);
    } catch (e) {
      setError('Failed to create document');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteDocument(deleteTarget.id);
      setDocs((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      setError('Failed to delete document');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = docs.filter((doc) => {
    const matchesSearch =
      search === '' || (doc.title || '').toLowerCase().includes(search.toLowerCase());
    const isOwner = doc.owner_id === user?.id || doc.user_role === 'owner';
    const matchesFilter =
      filter === 'All' ||
      (filter === 'Owned' && isOwner) ||
      (filter === 'Shared' && !isOwner);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              Workspace
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Collaborate and manage real-time documents with your team
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="pl-9 h-9 text-xs rounded-lg bg-card border-border"
              />
            </div>

            <Button
              onClick={handleCreate}
              disabled={creating}
              size="sm"
              className="gap-1.5 h-9 px-3.5 rounded-lg text-xs font-medium shadow-xs shrink-0"
            >
              <Plus size={15} />
              <span>{creating ? 'Creating...' : 'New Document'}</span>
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 mb-6 p-0.5 w-fit rounded-lg bg-secondary border border-border">
          {FILTER_OPTIONS.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`h-7 px-3 rounded-md text-xs font-medium transition-all ${
                  active
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>

        {/* Error notice */}
        {error && (
          <div className="flex items-center gap-2.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 mb-6 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-40 animate-pulse bg-muted/40" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mb-4">
              <FileText size={28} className="text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {search ? 'No matching documents' : 'No documents yet'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-xs">
              {search
                ? `No documents matched "${search}"`
                : 'Create your first document to collaborate with your team in real time.'}
            </p>
            {!search && (
              <Button onClick={handleCreate} className="gap-2">
                <Plus size={16} /> Create First Document
              </Button>
            )}
          </div>
        )}

        {/* Documents Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((doc) => (
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Document"
        message={`"${deleteTarget?.title || 'Untitled Document'}" will be permanently deleted.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
