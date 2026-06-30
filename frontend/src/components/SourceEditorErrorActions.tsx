import React from 'react';

interface SourceEditorErrorActionsProps {
  repairTitle: string;
  isProcessing: boolean;
  onRepair: () => void;
}

export const SourceEditorErrorActions: React.FC<SourceEditorErrorActionsProps> = ({
  repairTitle,
  isProcessing,
  onRepair,
}) => (
  <button
    data-tour="source-error-ai-fix"
    type="button"
    onClick={onRepair}
    disabled={isProcessing}
    className="rounded border border-violet-500/50 px-1 py-0 text-[10px] text-violet-100 transition-colors hover:bg-violet-800/40 disabled:cursor-not-allowed disabled:opacity-60"
    title={repairTitle}
    aria-label={repairTitle}
  >
    修复
  </button>
);
