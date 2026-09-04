import React, { lazy, Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCollaboration } from '../hooks/useCollaboration';
import TipTapEditor from '../components/TipTapEditor';
import CollaboratorDock from '../components/CollaboratorDock';
import ShareModal from '../components/ShareModal';
import RevisionHistoryDrawer from '../components/RevisionHistoryDrawer';
import CommentsDrawer from '../components/CommentsDrawer';
import ExportModal from '../components/ExportModal';
import Toast from '../components/Toast';
import {
  ArrowLeft, Share2, History, FileText, Palette,
  MessageSquare, Download, Sun, Moon, WifiOff,
  CheckCircle, Loader2, Edit3,
} from 'lucide-react';

// Lazy load Excalidraw only when Whiteboard tab is active
const ExcalidrawBoard = lazy(() => import('../components/ExcalidrawBoard'));

export default function EditorPage() {
  const { id } = useParams();
  const docId = parseInt(id, 10);
  const { user: currentUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Document state
  const [docMeta, setDocMeta] = useState(null);
  const [title, setTitle] = useState('Untitled Document');
  const [titleState, setTitleState] = useState('idle');

  // UI state
  const [activeTab, setActiveTab] = useState('doc');
  const [showShare, setShowShare] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
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
    const myName = currentUser?.full_name?.toLowerCase() || '';
    const isMentioned = (data.mentioned_names || []).some(n =>
      myName && n.toLowerCase().includes(myName.split(' ')[0])
    );
    if (isMentioned && data.sender_id !== currentUser?.id) {
      showToast(`💬 ${data.sender_name} mentioned you!`, 'info');
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

  const isReadOnly = userRole === 'viewer';

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

  // Auto-save title changes with debouncing
  const titleSaveTimer = useRef(null);
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    setTitleState('saving');
    clearTimeout(titleSaveTimer.current);
    titleSaveTimer.current = setTimeout(async () => {
      if (!val.trim() || isReadOnly) return;
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

  const collaborators = docMeta?.collaborators || [];

  // Sync status pill
  const SyncIndicator = () => {
    if (connectionStatus === 'connected') {
      return (
        <span className="hidden sm:flex items-center gap-1 text-xs font-medium text-emerald-500">
          <CheckCircle size={13} />
          Synced
        </span>
      );
    }
    return (
      <span className="hidden sm:flex items-center gap-1 text-xs font-medium text-amber-500">
        <Loader2 size={13} className="animate-spin" />
        Connecting...
      </span>
    );
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 py-1.5 px-4 text-xs font-semibold text-amber-700 dark:text-amber-400">
          <WifiOff size={13} />
          Working offline — changes will sync when reconnected
        </div>
      )}

      {/* Header Bar */}
      <header className="flex-shrink-0 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-3 sm:px-4 gap-2 sm:gap-3 z-30 shadow-soft">
        {/* Back Link */}
        <Link
          to="/dashboard"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors flex-shrink-0"
          title="Back to Dashboard"
        >
          <ArrowLeft size={18} />
        </Link>

        {/* Brand & Document Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Edit3 size={14} className="text-white" />
          </div>
          <div className="min-w-0 flex items-center gap-2">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              disabled={isReadOnly}
              placeholder="Untitled Document"
              className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 bg-transparent border border-transparent rounded-lg px-1.5 py-0.5 min-w-0 max-w-[140px] sm:max-w-[220px] md:max-w-[340px] focus:outline-none focus:border-brand-300 dark:focus:border-brand-600 focus:bg-slate-50 dark:focus:bg-slate-800 transition-all"
            />
            <SyncIndicator />
          </div>
        </div>

        {/* Tab Switcher: Document vs Whiteboard */}
        <div className="flex-shrink-0 flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('doc')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'doc'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-soft'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText size={14} />
            <span className="hidden sm:inline">Document</span>
          </button>
          <button
            onClick={() => setActiveTab('canvas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'canvas'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-soft'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Palette size={14} />
            <span className="hidden sm:inline">Whiteboard</span>
          </button>
        </div>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Active Collaborator Avatars */}
          {activeUsers.length > 0 && (
            <div className="hidden sm:flex items-center -space-x-1.5 mr-1">
              {activeUsers.slice(0, 4).map((u, i) => (
                <div
                  key={u.client_id || i}
                  className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: u.color || '#6366f1' }}
                  title={u.name || 'Collaborator'}
                >
                  {(u.name || 'U').charAt(0).toUpperCase()}
                </div>
              ))}
              {activeUsers.length > 4 && (
                <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 shadow-sm">
                  +{activeUsers.length - 4}
                </div>
              )}
            </div>
          )}

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
          </button>

          {/* Comments Toggle */}
          <button
            onClick={() => setShowComments((s) => !s)}
            className={`flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-semibold transition-all ${
              showComments
                ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
            title="Comments"
          >
            <MessageSquare size={15} />
            <span className="hidden md:inline">Comments</span>
          </button>

          {/* Export Button */}
          <button
            onClick={() => setShowExport(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-all"
            title="Export"
          >
            <Download size={15} />
            <span className="hidden md:inline">Export</span>
          </button>

          {/* History Button */}
          <button
            onClick={() => setShowHistory(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-all"
            title="Version History"
          >
            <History size={15} />
            <span className="hidden md:inline">History</span>
          </button>

          {/* Share Modal Trigger (Owner only) */}
          {docMeta?.user_role === 'owner' && (
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors shadow-sm"
              title="Share"
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">Share</span>
            </button>
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
                initialContent={initialContent}
                currentUser={currentUser}
                isReadOnly={isReadOnly}
                onOpenCommentDraft={(text) => {
                  setCommentDraft({ selectedText: text });
                  setShowComments(true);
                }}
                onContentChange={syncHtmlContent}
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

        {/* Floating Collaborator Dock */}
        <CollaboratorDock
          activeUsers={activeUsers}
          typingUsers={typingUsers}
        />
      </main>

      {/* Drawers and Modals */}
      {showShare && (
        <ShareModal
          docId={docId}
          isPublic={docMeta?.is_public}
          publicRole={docMeta?.public_role}
          collaborators={collaborators}
          onClose={() => setShowShare(false)}
          onShared={fetchDoc}
        />
      )}

      {showHistory && (
        <RevisionHistoryDrawer
          docId={docId}
          isOwner={docMeta?.user_role === 'owner'}
          onClose={() => setShowHistory(false)}
          onRollback={() => {
            showToast('Document restored to historical version!');
            setShowHistory(false);
          }}
        />
      )}

      {showComments && (
        <CommentsDrawer
          docId={docId}
          currentUserId={currentUser?.id}
          allCollaborators={collaborators}
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
