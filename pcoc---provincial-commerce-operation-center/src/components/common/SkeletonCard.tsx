import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs animate-pulse print:hidden">
      <div className="flex justify-between items-start mb-4">
        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
        <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-3/5 mb-4"></div>
      <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
      </div>
    </div>
  );
};
