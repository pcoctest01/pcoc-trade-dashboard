import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { DialogState } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface CustomDialogProps {
  dialog: DialogState;
  onClose: () => void;
}

export const CustomDialog: React.FC<CustomDialogProps> = ({ dialog, onClose }) => {
  const { t } = useLanguage();
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (dialog.isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog.isOpen, onClose]);

  if (!dialog.isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200/80 dark:border-slate-800 p-6 relative overflow-hidden animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          aria-label={t('messages.close')}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3.5 mb-4">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              dialog.type === 'confirm'
                ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-400/10 dark:text-rose-400'
                : dialog.type === 'alert'
                ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400'
                : 'bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400'
            }`}
          >
            {dialog.type === 'confirm' ? (
              <AlertCircle size={20} strokeWidth={2.2} />
            ) : dialog.type === 'alert' ? (
              <CheckCircle2 size={20} strokeWidth={2.2} />
            ) : (
              <Info size={20} strokeWidth={2.2} />
            )}
          </div>
          <div>
            <h3 id="dialog-title" className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {dialog.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-line leading-relaxed">
              {dialog.message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          {dialog.type === 'confirm' && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {t('messages.cancel')}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (dialog.type === 'confirm' && dialog.onConfirm) {
                onClose();
                setTimeout(() => dialog.onConfirm?.(), 50);
              } else {
                onClose();
              }
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl text-white shadow-xs transition-colors active:scale-95 ${
              dialog.type === 'confirm'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {dialog.type === 'confirm' ? t('messages.confirm') : t('common.ok') || 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};
