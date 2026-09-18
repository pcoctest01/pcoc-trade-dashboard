import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../../types';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        onDismiss(toasts[0].id);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-[120] flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] sm:w-auto pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-xl transition-all duration-200 animate-in slide-in-from-bottom-3 ${
            toast.type === 'success'
              ? 'bg-white/95 dark:bg-slate-900/95 border-emerald-500/20 dark:border-emerald-500/30 text-slate-800 dark:text-slate-100 shadow-emerald-500/5'
              : toast.type === 'error'
              ? 'bg-white/95 dark:bg-slate-900/95 border-rose-500/20 dark:border-rose-500/30 text-slate-800 dark:text-slate-100 shadow-rose-500/5'
              : 'bg-white/95 dark:bg-slate-900/95 border-blue-500/20 dark:border-blue-500/30 text-slate-800 dark:text-slate-100 shadow-blue-500/5'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' ? (
              <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={15} strokeWidth={2.4} />
              </div>
            ) : toast.type === 'error' ? (
              <div className="w-6 h-6 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle size={15} strokeWidth={2.4} />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Info size={15} strokeWidth={2.4} />
              </div>
            )}
            <span className="text-xs font-semibold leading-snug">{toast.text}</span>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            aria-label="ปิดแจ้งเตือน"
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
};
