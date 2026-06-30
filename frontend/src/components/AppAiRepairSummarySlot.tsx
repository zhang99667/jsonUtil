import React, { Suspense } from 'react';
import { LazyAiRepairSummaryBanner } from './appLazyPanels';
import type { AiRepairSummary } from '../utils/aiRepairSummary';

interface AppAiRepairSummarySlotProps {
  summary: AiRepairSummary | null;
  onClose: () => void;
  onCopySuccess: (message: string) => void;
  onCopyError: (errorMessage: string) => void;
}

export const AppAiRepairSummarySlot: React.FC<AppAiRepairSummarySlotProps> = ({
  summary,
  onClose,
  onCopySuccess,
  onCopyError,
}) => {
  if (!summary) return null;

  return (
    <Suspense fallback={null}>
      <LazyAiRepairSummaryBanner
        summary={summary}
        onClose={onClose}
        onCopySuccess={onCopySuccess}
        onCopyError={onCopyError}
      />
    </Suspense>
  );
};
