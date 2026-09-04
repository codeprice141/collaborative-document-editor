import React, { useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const CONFIGS = {
  success: { icon: CheckCircle, bg: 'bg-emerald-500', border: 'border-emerald-600' },
  error: { icon: XCircle, bg: 'bg-red-500', border: 'border-red-600' },
  info: { icon: Info, bg: 'bg-brand-500', border: 'border-brand-600' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-500', border: 'border-amber-600' },
};

export default function Toast({ message, type = 'success', onClose }) {
  const cfg = CONFIGS[type] || CONFIGS.success;
  const Icon = cfg.icon;
  const timerRef = useRef(null);

  useEffect(() => {
    if (message) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(onClose, 3500);
    }
    return () => clearTimeout(timerRef.current);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-2xl shadow-elevated border
        bg-slate-900 dark:bg-slate-800 border-slate-700 dark:border-slate-600
        text-white animate-slide-up pointer-events-auto
        max-w-sm sm:max-w-md
      `}>
        <div className={`w-7 h-7 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={15} className="text-white" />
        </div>
        <span className="text-sm font-medium flex-1">{message}</span>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors flex-shrink-0">
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
