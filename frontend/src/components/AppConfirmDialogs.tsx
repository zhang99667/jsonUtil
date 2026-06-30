import React from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import type { AppEditorUiState } from '../utils/appEditorUiState';

interface AppConfirmDialogsProps {
  pendingCloseFileName: string | null;
  isClearSourceConfirmOpen: boolean;
  hasPendingPasteSourceText: boolean;
  hasPendingApplyPreviewText: boolean;
  hasPendingSchemaExampleText: boolean;
  hasPendingSchemeInspectSourceText: boolean;
  editorUiState: AppEditorUiState;
  onConfirmCloseFile: () => void;
  onCancelCloseFile: () => void;
  onConfirmClearSource: () => void;
  onCancelClearSource: () => void;
  onConfirmPasteSource: () => void;
  onCancelPasteSource: () => void;
  onConfirmApplyPreviewToSource: () => void;
  onCancelApplyPreviewToSource: () => void;
  onConfirmApplySchemaExampleToSource: () => void;
  onCancelApplySchemaExampleToSource: () => void;
  onConfirmSchemeInspectSource: () => void;
  onCancelSchemeInspectSource: () => void;
}

export const AppConfirmDialogs: React.FC<AppConfirmDialogsProps> = ({
  pendingCloseFileName,
  isClearSourceConfirmOpen,
  hasPendingPasteSourceText,
  hasPendingApplyPreviewText,
  hasPendingSchemaExampleText,
  hasPendingSchemeInspectSourceText,
  editorUiState,
  onConfirmCloseFile,
  onCancelCloseFile,
  onConfirmClearSource,
  onCancelClearSource,
  onConfirmPasteSource,
  onCancelPasteSource,
  onConfirmApplyPreviewToSource,
  onCancelApplyPreviewToSource,
  onConfirmApplySchemaExampleToSource,
  onCancelApplySchemaExampleToSource,
  onConfirmSchemeInspectSource,
  onCancelSchemeInspectSource,
}) => (
  <>
    <ConfirmDialog
      isOpen={pendingCloseFileName !== null}
      title="关闭未保存标签"
      message={`文件「${pendingCloseFileName || '未命名文件'}」有未保存的修改。\n关闭后这些修改将丢失。`}
      confirmLabel="关闭并丢弃"
      cancelLabel="继续编辑"
      variant="danger"
      onConfirm={onConfirmCloseFile}
      onCancel={onCancelCloseFile}
    />

    <ConfirmDialog
      isOpen={isClearSourceConfirmOpen}
      title="清空源内容"
      message={editorUiState.clearSourceConfirmMessage}
      confirmLabel="清空"
      cancelLabel="继续保留"
      variant="danger"
      onConfirm={onConfirmClearSource}
      onCancel={onCancelClearSource}
    />

    <ConfirmDialog
      isOpen={hasPendingPasteSourceText}
      title="替换源内容"
      message={editorUiState.pasteSourceConfirmMessage}
      confirmLabel="替换"
      cancelLabel="继续保留"
      variant="danger"
      onConfirm={onConfirmPasteSource}
      onCancel={onCancelPasteSource}
    />

    <ConfirmDialog
      isOpen={hasPendingApplyPreviewText}
      title="应用预览到源"
      message={editorUiState.applyPreviewConfirmMessage}
      confirmLabel="应用"
      cancelLabel="继续保留"
      onConfirm={onConfirmApplyPreviewToSource}
      onCancel={onCancelApplyPreviewToSource}
    />

    <ConfirmDialog
      isOpen={hasPendingSchemaExampleText}
      title="应用 Schema 示例到源"
      message={editorUiState.applySchemaExampleConfirmMessage}
      confirmLabel="应用示例"
      cancelLabel="继续保留"
      onConfirm={onConfirmApplySchemaExampleToSource}
      onCancel={onCancelApplySchemaExampleToSource}
    />

    <ConfirmDialog
      isOpen={hasPendingSchemeInspectSourceText}
      title="用 Scheme 原始值排查"
      message={editorUiState.schemeInspectConfirmMessage}
      confirmLabel="替换并排查"
      cancelLabel="继续保留"
      variant="danger"
      onConfirm={onConfirmSchemeInspectSource}
      onCancel={onCancelSchemeInspectSource}
    />
  </>
);
