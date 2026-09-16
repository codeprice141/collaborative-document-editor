import React, { useState, useRef, useEffect } from 'react';
import { Users, ChevronUp, ChevronDown } from 'lucide-react';

export default function CollaboratorDock({ activeUsers = [], typingUsers = [], inline = false }) {
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

  if (activeUsers.length === 0) return null;

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
            className={`w-[calc(100vw-32px)] max-w-[280px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 mb-1 animate-in fade-in zoom-in-95 ${
              inline ? 'absolute bottom-full left-0 mb-2.5' : 'mb-1'
            }`}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Online Collaborators
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {activeUsers.length}
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-0.5">
              {activeUsers.map((u, i) => {
                const isTyping = typingUsers.includes(u.user_id);
                return (
                  <div
                    key={u.client_id || u.user_id || i}
                    className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm flex-shrink-0"
                        style={{ backgroundColor: u.color || '#6366f1' }}
                      >
                        {(u.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                          {u.name || 'Anonymous User'}
                        </p>
                        {u.email && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                            {u.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {isTyping ? (
                      <span className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 flex items-center gap-1 flex-shrink-0 animate-pulse">
                        typing...
                      </span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Typing indicators (floating mode only) */}
        {!inline && typingUsers.length > 0 && !isOpen && (
          <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in">
            <span className="flex gap-0.5 items-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:100ms]" />
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:200ms]" />
            </span>
            {typingUsers.length === 1 ? 'Someone is typing...' : `${typingUsers.length} typing...`}
          </div>
        )}

        {/* Trigger button */}
        {inline ? (
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95 ${
              isOpen ? 'ring-2 ring-indigo-500/30 border-indigo-500/50' : ''
            }`}
            title="View online collaborators"
          >
            <Users size={11} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
            <div className="flex items-center -space-x-1.5">
              {activeUsers.slice(0, 3).map((u, i) => (
                <div
                  key={u.client_id || u.user_id || i}
                  className="w-4 h-4 rounded-full border border-white dark:border-slate-900 flex items-center justify-center text-[7px] font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: u.color || '#6366f1' }}
                >
                  {(u.name || 'U').charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <span>{activeUsers.length} online</span>
            {isOpen ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className={`flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 shadow-md hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 active:scale-95 ${
              isOpen ? 'ring-2 ring-indigo-500/30 border-indigo-500/50' : ''
            }`}
            title="Click to view online collaborators"
          >
            <Users size={13} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
            <div className="flex items-center -space-x-2">
              {activeUsers.slice(0, 4).map((u, i) => (
                <div
                  key={u.client_id || u.user_id || i}
                  className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-bold text-white shadow-sm flex-shrink-0"
                  style={{ backgroundColor: u.color || '#6366f1' }}
                >
                  {(u.name || 'U').charAt(0).toUpperCase()}
                </div>
              ))}
              {activeUsers.length > 4 && (
                <div className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-slate-300">
                  +{activeUsers.length - 4}
                </div>
              )}
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {activeUsers.length} online
            </span>
            {isOpen ? (
              <ChevronDown size={13} className="text-slate-400 dark:text-slate-500" />
            ) : (
              <ChevronUp size={13} className="text-slate-400 dark:text-slate-500" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
