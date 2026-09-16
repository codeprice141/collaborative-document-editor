import React, { useState, useRef, useEffect } from 'react';
import { Users, ChevronUp, ChevronDown } from 'lucide-react';

export default function CollaboratorDock({
  activeUsers = [],
  typingUsers = [],
  currentUser = null,
  currentUserRole = 'editor',
  connectionStatus = 'connected',
  inline = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dockRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e) => {
      if (dockRef.current && !dockRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const displayUsers =
    activeUsers.length > 0
      ? activeUsers
      : currentUser
      ? [
          {
            user_id: currentUser.id,
            name: currentUser.full_name || currentUser.name || 'You',
            email: currentUser.email,
            color: '#6366f1',
          },
        ]
      : [];

  if (displayUsers.length === 0) return null;

  return (
    <div
      ref={dockRef}
      className={
        inline
          ? 'relative select-none z-30'
          : 'fixed bottom-12 sm:bottom-14 right-3 sm:right-6 z-30 select-none'
      }
    >
      <div className={`relative flex flex-col ${inline ? 'items-start' : 'items-end'} gap-2`}>
        {/* Floating Collaborators List Popover */}
        {isOpen && (
          <div
            className={`w-[calc(100vw-32px)] max-w-[280px] bg-card text-card-foreground border border-border rounded-2xl shadow-xl p-3 mb-1 animate-in fade-in zoom-in-95 ${
              inline ? 'absolute bottom-full left-0 mb-2.5' : 'mb-1'
            }`}
          >
            {/* Top Section: Connection/Sync Status & User Role */}
            <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-border">
              {/* Sync status */}
              <div className="flex items-center gap-1.5 min-w-0">
                {connectionStatus === 'connected' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs font-semibold text-foreground truncate">
                      Saved & Synced
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 truncate">
                      Syncing...
                    </span>
                  </>
                )}
              </div>

              {/* User Role Pill */}
              {currentUserRole === 'owner' ? (
                <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md shrink-0">
                  Owner
                </span>
              ) : currentUserRole === 'viewer' ? (
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md shrink-0">
                  View only
                </span>
              ) : (
                <span className="text-[10px] font-medium text-muted-foreground bg-secondary border border-border px-2 py-0.5 rounded-md shrink-0">
                  Editor
                </span>
              )}
            </div>

            {/* Collaborators Subheader */}
            <div className="flex items-center justify-between pb-1.5 mb-1 text-[11px] font-medium text-muted-foreground">
              <span>Active in Document</span>
              <span className="bg-secondary text-foreground text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                {displayUsers.length}
              </span>
            </div>

            {/* Collaborator User List */}
            <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
              {displayUsers.map((u, i) => {
                const isTyping = typingUsers.includes(u.user_id);
                const isMe = currentUser && (u.user_id === currentUser.id || u.email === currentUser.email);
                return (
                  <div
                    key={u.client_id || u.user_id || i}
                    className="flex items-center justify-between p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-xs shrink-0"
                        style={{ backgroundColor: u.color || '#6366f1' }}
                      >
                        {(u.name || u.full_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate flex items-center gap-1">
                          {u.name || u.full_name || 'Anonymous User'}
                          {isMe && (
                            <span className="text-[9px] font-normal text-muted-foreground">(you)</span>
                          )}
                        </p>
                        {u.email && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {u.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {isTyping ? (
                      <span className="text-[10px] font-semibold text-primary flex items-center gap-1 shrink-0 animate-pulse">
                        typing...
                      </span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Typing indicators (floating mode only) */}
        {!inline && typingUsers.length > 0 && !isOpen && (
          <div className="bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in">
            <span className="flex gap-0.5 items-center">
              <span className="w-1.5 h-1.5 bg-background rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-background rounded-full animate-bounce [animation-delay:100ms]" />
              <span className="w-1.5 h-1.5 bg-background rounded-full animate-bounce [animation-delay:200ms]" />
            </span>
            {typingUsers.length === 1 ? 'Someone is typing...' : `${typingUsers.length} typing...`}
          </div>
        )}

        {/* Trigger button */}
        {inline ? (
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground text-[11px] font-medium border border-border transition-all cursor-pointer active:scale-95 ${
              isOpen ? 'ring-2 ring-primary/30 border-primary/50' : ''
            }`}
            title="View document status & collaborators"
          >
            <Users size={11} className="text-muted-foreground shrink-0" />
            <div className="flex items-center -space-x-1.5">
              {displayUsers.slice(0, 3).map((u, i) => (
                <div
                  key={u.client_id || u.user_id || i}
                  className="w-4 h-4 rounded-full border border-background flex items-center justify-center text-[7px] font-bold text-white shrink-0"
                  style={{ backgroundColor: u.color || '#6366f1' }}
                >
                  {(u.name || u.full_name || 'U').charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <span>{displayUsers.length} online</span>
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`}
              title={connectionStatus === 'connected' ? 'Saved & Synced' : 'Syncing...'}
            />
            {isOpen ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className={`flex items-center gap-2 bg-card text-card-foreground border border-border rounded-full px-3 py-1.5 shadow-md hover:shadow-lg hover:border-border/80 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 active:scale-95 ${
              isOpen ? 'ring-2 ring-primary/30 border-primary/50' : ''
            }`}
            title="Click to view document status & collaborators"
          >
            <Users size={13} className="text-muted-foreground shrink-0" />
            <div className="flex items-center -space-x-1.5">
              {displayUsers.slice(0, 4).map((u, i) => (
                <div
                  key={u.client_id || u.user_id || i}
                  className="w-5 h-5 rounded-full border-2 border-card flex items-center justify-center text-[9px] font-bold text-white shadow-xs shrink-0"
                  style={{ backgroundColor: u.color || '#6366f1' }}
                >
                  {(u.name || u.full_name || 'U').charAt(0).toUpperCase()}
                </div>
              ))}
              {displayUsers.length > 4 && (
                <div className="w-5 h-5 rounded-full border-2 border-card bg-muted text-muted-foreground flex items-center justify-center text-[8px] font-bold">
                  +{displayUsers.length - 4}
                </div>
              )}
            </div>
            <span className="text-xs font-semibold text-foreground">
              {displayUsers.length} online
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`}
              title={connectionStatus === 'connected' ? 'Saved & Synced' : 'Syncing...'}
            />
            {isOpen ? (
              <ChevronDown size={13} className="text-muted-foreground" />
            ) : (
              <ChevronUp size={13} className="text-muted-foreground" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
