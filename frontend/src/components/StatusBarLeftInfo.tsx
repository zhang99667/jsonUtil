import React from 'react';
import type { FileTab } from '../types';
import type { StatusBarBadgeState } from '../utils/statusBarState';
import type { StatusBarSourceValidationAction } from '../utils/statusBarSourceValidationAction';
import { StatusBarActiveFileBadge } from './StatusBarActiveFileBadge';
import { StatusBarContentMetrics } from './StatusBarContentMetrics';
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
    <span
      data-tour="save-status"
      className={`shrink-0 px-1.5 py-0.5 rounded font-bold leading-none ${saveStatus.className}`}
      title={saveStatus.title}
    >
      {saveStatus.label}
    </span>
    <StatusBarSourceValidationBadge
      status={sourceValidationStatus}
      action={sourceValidationAction}
    />
  </div>
);
