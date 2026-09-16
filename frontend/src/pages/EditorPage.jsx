import React, { lazy, Suspense, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCollaboration } from '../hooks/useCollaboration';
import TipTapEditor from '../components/TipTapEditor';
import CollaboratorDock from '../components/CollaboratorDock';
import ShareModal from '../components/ShareModal';
import CommentsDrawer from '../components/CommentsDrawer';
import ExportModal from '../components/ExportModal';
import Toast from '../components/Toast';
import { playNotificationChime } from '../utils/audio';
import {
  ArrowLeft, Share2, FileText, Palette,
  MessageSquare, Download, Sun, Moon, WifiOff,
  CheckCircle, Loader2, Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Lazy load Excalidraw only when Whiteboard tab is active
const ExcalidrawBoard = lazy(() => import('../components/ExcalidrawBoard'));

export default function EditorPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const docId = parseInt(id, 10);
  const { user: currentUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Document state
  const [docMeta, setDocMeta] = useState(null);
  const [title, setTitle] = useState('Untitled Document');
  const [titleState, setTitleState] = useState('idle');

  // UI state
  const defaultTab = searchParams.get('tab') === 'canvas' ? 'canvas' : 'doc';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showShare, setShowShare] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [unreadCommentsCount, setUnreadCommentsCount] = useState(0);
  const [showExport, setShowExport] = useState(false);
  const [commentDraft, setCommentDraft] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Comments / Drawings incoming event handlers
  const [incomingComment, setIncomingComment] = useState(null);
  const drawListenerRef = useRef(null);
  const registerDrawListener = useCallback((cb) => { drawListenerRef.current = cb; }, []);

  const handleRemoteDraw = useCallback((payload) => {
    if (drawListenerRef.current) drawListenerRef.current(payload);
  }, []);

  const handleRemoteComment = useCallback((data) => {
    setIncomingComment(data);
    if (!data || data.sender_id === currentUser?.id) return;

    const isMentioned =
      (data.mentioned_user_ids || []).includes(currentUser?.id) ||
      (data.mentioned_emails || []).some(
        (e) => currentUser?.email && e.toLowerCase() === currentUser.email.toLowerCase()
      ) ||
      (data.mentioned_names || []).some((n) => {
        const myName = currentUser?.full_name?.toLowerCase() || '';
        return myName && n.toLowerCase().includes(myName.split(' ')[0]);
      });

    if (isMentioned) {
      playNotificationChime();
      showToast(`💬 ${data.sender_name} mentioned you in a comment!`, 'info');
      setShowComments(true);
      setUnreadCommentsCount(0);
    } else {
      setShowComments((isOpen) => {
        if (!isOpen) {
          setUnreadCommentsCount((c) => c + 1);
        }
        return isOpen;
      });
    }
  }, [currentUser]);

  // Primary real-time collaboration hook
  const {
    yjsDoc,
    initialContent,
    drawingData,
    setDrawingData,
    userRole,
    activeUsers,
    typingUsers,
    connectionStatus,
    isReady,
    sendDraw,
    sendCommentEvent,
    syncHtmlContent,
  } = useCollaboration(docId, handleRemoteDraw, handleRemoteComment);

  const effectiveRole = (docMeta?.user_role || userRole || 'editor').toLowerCase();
  const isReadOnly = effectiveRole === 'viewer';
  const canEditTitle = docMeta?.user_role === 'owner';

  // Online / Offline tracking
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchDoc = async () => {
    try {
      const data = await api.getDocument(docId);
      setDocMeta(data);
      setTitle(data.title || 'Untitled Document');
    } catch (err) {
      console.error('Failed to load document metadata', err);
    }
  };

  useEffect(() => {
    fetchDoc();
  }, [docId]);

  // Auto-save title changes with debouncing (Owner only)
  const titleSaveTimer = useRef(null);
  const handleTitleChange = (e) => {
    if (!canEditTitle) return;
    const val = e.target.value;
    setTitle(val);
    setTitleState('saving');
    clearTimeout(titleSaveTimer.current);
    titleSaveTimer.current = setTimeout(async () => {
      if (!val.trim() || !canEditTitle) return;
      try {
        await api.updateDocument(docId, { title: val.trim() });
        setTitleState('saved');
        setTimeout(() => setTitleState('idle'), 2000);
      } catch {
        setTitleState('error');
      }
    }, 800);
  };

  const handleSaveDrawing = useCallback(async (elementsJson) => {
    setDrawingData(elementsJson);
    if (!isReadOnly) {
      try {
        await api.updateDocument(docId, { drawing_data: elementsJson });
      } catch (e) {
        /* silent */
      }
    }
  }, [docId, isReadOnly, setDrawingData]);

  const restSaveTimer = useRef(null);
  const handleContentChange = useCallback((html) => {
    // 1. Live broadcast to peers over WebSocket
    syncHtmlContent(html);
    // 2. Persist to PostgreSQL database via REST fallback with 1s debounce
    clearTimeout(restSaveTimer.current);
    restSaveTimer.current = setTimeout(async () => {
      if (!isReadOnly) {
        try {
          await api.updateDocument(docId, { content: html });
        } catch (err) {
          console.debug('Auto-save REST fallback:', err);
        }
      }
    }, 1000);
  }, [syncHtmlContent, isReadOnly, docId]);

  const collaborators = docMeta?.collaborators || [];

  // Normalized, deduplicated candidate directory for @mentions
  const mentionableUsers = useMemo(() => {
    const map = new Map();

    // 1. Document Owner
    if (docMeta?.owner) {
      const ownerId = docMeta.owner.id || docMeta.owner_id;
      map.set(ownerId, {
        user_id: ownerId,
        full_name: docMeta.owner.full_name || docMeta.owner.email || 'Owner',
        email: docMeta.owner.email || '',
        role: 'owner',
        is_online: (activeUsers || []).some((u) => u.user_id === ownerId),
      });
    }

    // 2. Persistent Stored Collaborators
    (docMeta?.collaborators || []).forEach((c) => {
      const uid = c.user_id || c.user?.id || c.id;
      if (!uid) return;
      if (!map.has(uid)) {
        map.set(uid, {
          user_id: uid,
          full_name:
            c.user?.full_name || c.full_name || c.user?.email || c.email || 'Collaborator',
          email: c.user?.email || c.email || '',
          role: (c.role || 'editor').toLowerCase(),
          is_online: (activeUsers || []).some((u) => u.user_id === uid),
        });
      }
    });

    // 3. Live Active Peers in Room
    (activeUsers || []).forEach((u) => {
      if (!u.user_id) return;
      const existing = map.get(u.user_id);
      if (existing) {
        existing.is_online = true;
      } else {
        map.set(u.user_id, {
          user_id: u.user_id,
          full_name: u.name || u.email || 'User',
          email: u.email || '',
          role: 'viewer',
          is_online: true,
        });
      }
    });

    // Exclude current user from self-mentioning
    if (currentUser?.id) {
      map.delete(currentUser.id);
    }

    // Online users first, then alphabetical
    return Array.from(map.values()).sort((a, b) => {
      if (a.is_online && !b.is_online) return -1;
      if (!a.is_online && b.is_online) return 1;
      return (a.full_name || '').localeCompare(b.full_name || '');
    });
  }, [docMeta, activeUsers, currentUser]);

  return (
    <div className="h-[100dvh] flex flex-col bg-background text-foreground overflow-hidden">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="flex items-center justify-center gap-2 bg-amber-500/10 border-b border-amber-500/20 py-1.5 px-4 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <WifiOff size={13} />
          Working offline — changes will sync when reconnected
        </div>
      )}

      {/* Header Bar */}
      <header className="flex-shrink-0 h-14 bg-card border-b border-border flex items-center justify-between px-3 sm:px-4 gap-2 sm:gap-3 z-30 shadow-xs relative">
        {/* Left: Back Link & Document Title */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 z-10 max-w-[45%]">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0">
            <Link to="/dashboard" title="Back to Dashboard">
              <ArrowLeft size={17} />
            </Link>
          </Button>

          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            disabled={!canEditTitle}
            placeholder="Untitled Document"
            title={canEditTitle ? 'Click to rename' : 'Only document owner can rename document'}
            className={`text-sm sm:text-base font-semibold text-foreground bg-transparent rounded-lg px-2 py-0.5 min-w-0 max-w-[150px] sm:max-w-[220px] md:max-w-[300px] truncate transition-all ${
              canEditTitle
                ? 'border border-transparent hover:bg-muted/30 focus:outline-none focus:border-border focus:bg-muted/50 cursor-text'
                : 'border-transparent cursor-default select-none'
            }`}
          />
        </div>

        {/* Center: Tab Switcher (Document vs Whiteboard) — Perfectly Centered & Icon-only */}
        <div className="absolute left-1/2 -translate-x-1/2 z-10">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-8 p-0.5 bg-secondary/80 border border-border/60">
              <TabsTrigger
                value="doc"
                className="h-7 w-8 p-0 flex items-center justify-center text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-xs rounded-md transition-all"
                title="Document editor"
              >
                <FileText size={15} />
              </TabsTrigger>
              <TabsTrigger
                value="canvas"
                className="h-7 w-8 p-0 flex items-center justify-center text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-xs rounded-md transition-all"
                title="Whiteboard canvas"
              >
                <Palette size={15} />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Right: Actions & Tools */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 z-10">
          {/* Active Collaborator Avatars */}
          {activeUsers.length > 0 && (
            <div
              onClick={() => docMeta?.user_role === 'owner' && setShowShare(true)}
              className={`hidden sm:flex items-center -space-x-1.5 mr-1 ${
                docMeta?.user_role === 'owner' ? 'cursor-pointer hover:opacity-90' : ''
              }`}
              title={docMeta?.user_role === 'owner' ? 'Click to manage collaborators & permissions' : 'Active collaborators'}
            >
              {activeUsers.slice(0, 4).map((u, i) => (
                <div
                  key={u.client_id || i}
                  className="w-7 h-7 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: u.color || '#6366f1' }}
                  title={u.name || 'Collaborator'}
                >
                  {(u.name || 'U').charAt(0).toUpperCase()}
                </div>
              ))}
              {activeUsers.length > 4 && (
                <div className="w-7 h-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shadow-sm">
                  +{activeUsers.length - 4}
                </div>
              )}
            </div>
          )}

          {/* Comments Toggle (Icon-only) */}
          <Button
            variant={showComments ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => {
              setShowComments((s) => !s);
              setUnreadCommentsCount(0);
            }}
            className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Comments"
          >
            <MessageSquare size={16} />
            {unreadCommentsCount > 0 && !showComments && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white shadow-xs animate-in zoom-in">
                {unreadCommentsCount}
              </span>
            )}
          </Button>

          {/* Export Button (Icon-only) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowExport(true)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Export document"
          >
            <Download size={16} />
          </Button>

          {/* Theme Switcher (Icon-only) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
          </Button>

          {/* Share Modal Trigger (Icon-only) */}
          {docMeta?.user_role === 'owner' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowShare(true)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Share document"
            >
              <Share2 size={16} />
            </Button>
          )}
        </div>
      </header>

      {/* Main Surface */}
      <main className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
        {/* Document Editor */}
        {activeTab === 'doc' && (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {isReady ? (
              <TipTapEditor
                yjsDoc={yjsDoc}
                initialContent={initialContent || docMeta?.content || ''}
                activeUsers={activeUsers}
                typingUsers={typingUsers}
                currentUser={currentUser}
                currentUserRole={effectiveRole}
                connectionStatus={connectionStatus}
                isReadOnly={isReadOnly}
                onOpenCommentDraft={(text) => {
                  setCommentDraft({ selectedText: text });
                  setShowComments(true);
                }}
                onContentChange={handleContentChange}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <Loader2 size={32} className="animate-spin text-brand-500" />
                  <p className="text-sm font-medium">Connecting to document room...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Whiteboard Canvas */}
        {activeTab === 'canvas' && (
          <div className="flex-1 overflow-hidden">
            <Suspense
              fallback={
                <div className="flex-1 flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <Loader2 size={32} className="animate-spin text-brand-500" />
                    <p className="text-sm font-medium">Loading Excalidraw Whiteboard...</p>
                  </div>
                </div>
              }
            >
              <ExcalidrawBoard
                initialData={drawingData}
                onSave={handleSaveDrawing}
                onSendDraw={sendDraw}
                registerListener={registerDrawListener}
                isReadOnly={isReadOnly}
                isDark={isDark}
              />
            </Suspense>
          </div>
        )}

        {/* Floating Collaborator Dock: On desktop always; on mobile only when canvas tab is active */}
        <div className={activeTab === 'doc' ? 'hidden sm:block' : 'block'}>
          <CollaboratorDock
            activeUsers={activeUsers}
            typingUsers={typingUsers}
            currentUser={currentUser}
            currentUserRole={effectiveRole}
            connectionStatus={connectionStatus}
          />
        </div>
      </main>

      {/* Drawers and Modals */}
      {showShare && (
        <ShareModal
          docId={docId}
          isPublic={docMeta?.is_public}
          publicRole={docMeta?.public_role}
          collaborators={docMeta?.collaborators || []}
          onClose={() => setShowShare(false)}
          onShared={fetchDoc}
        />
      )}


      {showComments && (
        <CommentsDrawer
          docId={docId}
          currentUserId={currentUser?.id}
          allCollaborators={mentionableUsers}
          initialDraft={commentDraft}
          onClearDraft={() => setCommentDraft(null)}
          onSendCommentEvent={sendCommentEvent}
          incomingCommentEvent={incomingComment}
          onClose={() => setShowComments(false)}
        />
      )}

      {showExport && (
        <ExportModal
          isOpen={showExport}
          title={title}
          onClose={() => setShowExport(false)}
        />
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}
