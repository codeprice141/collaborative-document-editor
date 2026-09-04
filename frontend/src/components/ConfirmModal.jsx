import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!isOpen) return null;

  const isDanger = type === 'danger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 dark:bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-modal p-6 max-w-sm w-full animate-slide-up">
        {/* Header Icon + Close */}
        <div className="flex items-start justify-between mb-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
            isDanger
              ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
              : 'bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400'
          }`}>
            {isDanger ? <AlertTriangle size={22} /> : <Info size={22} />}
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X size={17} />
          </button>
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 h-10 rounded-xl text-white text-sm font-semibold transition-all shadow-sm flex items-center justify-center ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700 disabled:opacity-60'
                : 'bg-brand-600 hover:bg-brand-700 disabled:opacity-60'
            }`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
