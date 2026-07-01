import React from 'react';
import { StatusBarContentMetrics } from './StatusBarContentMetrics';
import type { StatusBarLeftInfoProps } from './StatusBarLeftInfoTypes';
import { StatusBarStatusBadges } from './StatusBarStatusBadges';

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
    <StatusBarStatusBadges
      activeFile={activeFile}
      saveStatus={saveStatus}
      sourceValidationStatus={sourceValidationStatus}
      sourceValidationAction={sourceValidationAction}
    />
  </div>
);
