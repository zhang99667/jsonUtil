import React from 'react';
import type { FileTab } from '../types';

interface StatusBarActiveFileBadgeProps {
  activeFile: FileTab | null;
}

export const StatusBarActiveFileBadge: React.FC<StatusBarActiveFileBadgeProps> = ({
  activeFile,
}) => {
  if (!activeFile) return null;

  return (
    <span
      className="flex min-w-[4rem] max-w-[16rem] items-center gap-1 text-blue-200"
      title={activeFile.path || activeFile.name}
    >
      <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="truncate">{activeFile.name}</span>
    </span>
  );
};
