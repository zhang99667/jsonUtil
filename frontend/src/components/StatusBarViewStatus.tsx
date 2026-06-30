import React from 'react';
import type { LocalProcessingStatus } from '../utils/localProcessingStatus';
import { TransformMode } from '../types';
import { StatusBarLocalProcessingBadge } from './StatusBarLocalProcessingBadge';
import { StatusBarModeBadge } from './StatusBarModeBadge';
import { StatusBarVersionBadge } from './StatusBarVersionBadge';

interface StatusBarViewStatusProps {
  localProcessingStatus: LocalProcessingStatus;
  mode: TransformMode;
  onOpenChangelog?: () => void;
}

export const StatusBarViewStatus: React.FC<StatusBarViewStatusProps> = ({
  localProcessingStatus,
  mode,
  onOpenChangelog,
}) => (
  <div data-tour="statusbar-view" className="flex shrink-0 items-center gap-2">
    <StatusBarLocalProcessingBadge localProcessingStatus={localProcessingStatus} />
    <StatusBarModeBadge mode={mode} />
    <StatusBarVersionBadge onOpenChangelog={onOpenChangelog} />
  </div>
);
