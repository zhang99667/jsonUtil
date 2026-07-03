import React, { useMemo } from 'react';
import { DOCUMENT_STATS_SCAN_LIMIT } from '../utils/appAsyncPolicy';
import { getDocumentStats } from '../utils/documentStats';
import { StatusBar } from './StatusBar';
import type { AppStatusBarControllerProps } from './AppStatusBarControllerTypes';

export const AppStatusBarController: React.FC<AppStatusBarControllerProps> = ({
  sourceText,
  previewText,
  activeEditor,
  mode,
  activeFileId,
  files,
  isAutoSaveEnabled,
  isSourceLarge,
  isOutputTransforming,
  isAiRepairing,
  isAiConfigured,
  editorUiState,
  sourceValidation,
  sourceValidationLocation,
  onLocateSourceError,
  onOpenSourceSchemeInput,
  onOpenChangelog,
  cursorLine,
  cursorColumn,
}) => {
  const documentStats = useMemo(() => {
    const content = activeEditor === 'PREVIEW' ? previewText : sourceText;
    return getDocumentStats(content, { maxScanLength: DOCUMENT_STATS_SCAN_LIMIT });
  }, [activeEditor, previewText, sourceText]);

  return (
    <StatusBar
      inputLength={sourceText.length}
      activeContentLength={documentStats.characterCount}
      activeContentByteLength={documentStats.utf8ByteLength}
      totalLines={documentStats.totalLines}
      maxColumns={documentStats.maxColumns}
      isStatsLimited={documentStats.isLimited}
      mode={mode}
      activeFileId={activeFileId}
      files={files}
      isAutoSaveEnabled={isAutoSaveEnabled}
      isSourceLarge={isSourceLarge}
      isOutputTransforming={isOutputTransforming}
      isAiRepairing={isAiRepairing}
      isAiConfigured={isAiConfigured}
      hasSourceContent={editorUiState.hasSourceContent}
      isSourceJsonCandidate={editorUiState.isSourceJsonCandidate}
      sourceStandaloneDeepFormatKind={editorUiState.sourceStandaloneDeepFormatKind}
      onOpenSourceSchemeInput={onOpenSourceSchemeInput}
      onOpenChangelog={() => onOpenChangelog()}
      sourceValidation={sourceValidation}
      sourceValidationLocation={sourceValidationLocation}
      onLocateSourceError={onLocateSourceError}
      cursorLine={cursorLine}
      cursorColumn={cursorColumn}
    />
  );
};
