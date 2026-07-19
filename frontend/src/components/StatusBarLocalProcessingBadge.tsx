import React from 'react';
import type { LocalProcessingStatus, LocalProcessingStatusTone } from '../utils/localProcessingStatus';

interface StatusBarLocalProcessingBadgeProps {
  localProcessingStatus: LocalProcessingStatus;
}

const LOCAL_PROCESSING_STATUS_CLASS_NAMES: Record<LocalProcessingStatusTone, string> = {
  local: 'bg-sky-950 text-white',
  large: 'bg-amber-100 text-amber-900',
  worker: 'bg-cyan-100 text-cyan-900',
  repairing: 'bg-violet-100 text-violet-900',
};

export const StatusBarLocalProcessingBadge: React.FC<StatusBarLocalProcessingBadgeProps> = ({
  localProcessingStatus,
}) => (
  <span
    data-tour="local-processing-status"
    className={`shrink-0 rounded px-1.5 py-0.5 font-bold leading-none ${LOCAL_PROCESSING_STATUS_CLASS_NAMES[localProcessingStatus.tone]}`}
    title={localProcessingStatus.title}
  >
    {localProcessingStatus.label}
  </span>
);
