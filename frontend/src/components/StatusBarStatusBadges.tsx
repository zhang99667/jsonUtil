import React from 'react';
import type { StatusBarStatusBadgesProps } from './StatusBarLeftInfoTypes';
import { StatusBarActiveFileBadge } from './StatusBarActiveFileBadge';
import { StatusBarSaveStatusBadge } from './StatusBarSaveStatusBadge';
import { StatusBarSourceValidationBadge } from './StatusBarSourceValidationBadge';

export const StatusBarStatusBadges: React.FC<StatusBarStatusBadgesProps> = ({
  activeFile,
  saveStatus,
  sourceValidationStatus,
  sourceValidationAction,
}) => (
  <>
    <StatusBarActiveFileBadge activeFile={activeFile} />
    <StatusBarSaveStatusBadge status={saveStatus} />
    <StatusBarSourceValidationBadge
      status={sourceValidationStatus}
      action={sourceValidationAction}
    />
  </>
);
