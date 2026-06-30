import React from 'react';
import type { StatusBarBadgeState } from '../utils/statusBarState';

interface StatusBarSaveStatusBadgeProps {
  status: StatusBarBadgeState;
}

export const StatusBarSaveStatusBadge: React.FC<StatusBarSaveStatusBadgeProps> = ({
  status,
}) => (
  <span
    data-tour="save-status"
    className={`shrink-0 px-1.5 py-0.5 rounded font-bold leading-none ${status.className}`}
    title={status.title}
  >
    {status.label}
  </span>
);
