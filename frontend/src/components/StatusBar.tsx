import React from 'react';
import type { TransformMode, FileTab, ValidationResult } from '../types';
import type { StatusBarSourceValidationLocation } from '../utils/statusBarState';
import { buildStatusBarViewModel } from '../utils/statusBarViewModel';
import type { StandaloneDeepFormatInputKind } from '../utils/transformations';
import { StatusBarLeftInfo } from './StatusBarLeftInfo';
import { StatusBarViewStatus } from './StatusBarViewStatus';

interface StatusBarProps {
  inputLength: number;
  activeContentLength: number;
  activeContentByteLength: number;
  totalLines: number;
  maxColumns: number;
  isStatsLimited: boolean;
  mode: TransformMode;
  activeFileId: string | null;
  files: FileTab[];
  isAutoSaveEnabled: boolean;
  isSourceLarge: boolean;
  isOutputTransforming: boolean;
  isAiRepairing: boolean;
  isAiConfigured: boolean;
  hasSourceContent: boolean;
  isSourceJsonCandidate: boolean;
  sourceStandaloneDeepFormatKind: StandaloneDeepFormatInputKind | null;
  onOpenSourceSchemeInput?: () => void;
  onOpenChangelog?: () => void;
  sourceValidation: ValidationResult;
  sourceValidationLocation: StatusBarSourceValidationLocation | null;
  onLocateSourceError?: () => void;
  cursorLine?: number;
  cursorColumn?: number;
}

export const StatusBar: React.FC<StatusBarProps> = (props) => {
  const {
    activeContentLength,
    totalLines,
    maxColumns,
    isStatsLimited,
    mode,
    onOpenChangelog,
    cursorLine,
    cursorColumn,
  } = props;
  const statusBarViewModel = buildStatusBarViewModel(props);

  return (
    <div
      data-tour="statusbar"
      className="h-6 bg-brand-primary flex items-center justify-between gap-2 overflow-hidden px-3 text-[11px] text-white select-none z-20 flex-shrink-0"
    >
      <StatusBarLeftInfo
        activeContentLength={activeContentLength}
        byteSizeText={statusBarViewModel.byteSizeText}
        totalLines={totalLines}
        maxColumns={maxColumns}
        isStatsLimited={isStatsLimited}
        cursorLine={cursorLine}
        cursorColumn={cursorColumn}
        activeFile={statusBarViewModel.activeFile}
        saveStatus={statusBarViewModel.saveStatus}
        sourceValidationStatus={statusBarViewModel.sourceValidationStatus}
        sourceValidationAction={statusBarViewModel.sourceValidationAction}
      />

      {/* 右侧：当前视图模式与版本号 */}
      <StatusBarViewStatus
        localProcessingStatus={statusBarViewModel.localProcessingStatus}
        mode={mode}
        onOpenChangelog={onOpenChangelog}
      />
    </div>
  );
};
