import React from 'react';
import type { FileTab } from '../types';
import type { StatusBarBadgeState } from '../utils/statusBarState';
import type { StatusBarSourceValidationAction } from '../utils/statusBarSourceValidationActionTypes';
import { StatusBarActiveFileBadge } from './StatusBarActiveFileBadge';
import { StatusBarContentMetrics } from './StatusBarContentMetrics';
import { StatusBarSaveStatusBadge } from './StatusBarSaveStatusBadge';
import { StatusBarSourceValidationBadge } from './StatusBarSourceValidationBadge';

interface StatusBarLeftInfoProps {
  activeContentLength: number;
  byteSizeText: string;
  totalLines: number;
  maxColumns: number;
  isStatsLimited: boolean;
  cursorLine?: number;
  cursorColumn?: number;
  activeFile: FileTab | null;
  saveStatus: StatusBarBadgeState;
  sourceValidationStatus: StatusBarBadgeState;
  sourceValidationAction: StatusBarSourceValidationAction;
}

export const StatusBarLeftInfo: React.FC<StatusBarLeftInfoProps> = ({
  activeContentLength,
  byteSizeText,
  totalLines,
  maxColumns,
  isStatsLimited,
  cursorLine,
  cursorColumn,
  activeFile,
  saveStatus,
  sourceValidationStatus,
  sourceValidationAction,
}) => (
  <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
    <StatusBarContentMetrics
      activeContentLength={activeContentLength}
      byteSizeText={byteSizeText}
      totalLines={totalLines}
      maxColumns={maxColumns}
      isStatsLimited={isStatsLimited}
      cursorLine={cursorLine}
      cursorColumn={cursorColumn}
    />
    <StatusBarActiveFileBadge activeFile={activeFile} />
    <StatusBarSaveStatusBadge status={saveStatus} />
    <StatusBarSourceValidationBadge
      status={sourceValidationStatus}
      action={sourceValidationAction}
    />
  </div>
);
