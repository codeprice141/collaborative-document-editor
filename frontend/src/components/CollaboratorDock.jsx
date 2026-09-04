import React from 'react';
import { Users } from 'lucide-react';

export default function CollaboratorDock({ activeUsers = [], typingUsers = [] }) {
  if (activeUsers.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-30">
      <div className="flex flex-col items-end gap-2">
        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-elevated flex items-center gap-1.5 animate-fade-in">
            <span className="flex gap-0.5 items-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:100ms]" />
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:200ms]" />
            </span>
            {typingUsers.length === 1
              ? `Someone is typing...`
              : `${typingUsers.length} people typing...`}
          </div>
        )}

        {/* Active users pill */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 shadow-card">
          <Users size={13} className="text-slate-400 dark:text-slate-500" />
          <div className="flex items-center -space-x-2">
            {activeUsers.slice(0, 5).map((u, i) => (
              <div
                key={u.client_id || i}
                title={u.name || 'Collaborator'}
                className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-bold text-white shadow-sm flex-shrink-0"
                style={{ backgroundColor: u.color || '#6366f1' }}
              >
                {(u.name || 'U').charAt(0).toUpperCase()}
              </div>
            ))}
            {activeUsers.length > 5 && (
              <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300">
                +{activeUsers.length - 5}
              </div>
            )}
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {activeUsers.length} online
          </span>
        </div>
      </div>
    </div>
  );
}
