import type {
  AppPreviewOutputSyncTaskFlatInput,
  AppPreviewOutputSyncTaskInput,
} from './appPreviewOutputSyncTaskTypes';

export const buildAppPreviewOutputSyncTaskInput = ({
  previewText,
  files,
  activeFileId,
  mode,
  validateJsonMaybeAsync,
  inputRef,
  fallbackContextRef,
  pendingOutputValue,
  setPreviewValidation,
  onSetInput,
  onUpdateActiveFileContent,
}: AppPreviewOutputSyncTaskFlatInput): AppPreviewOutputSyncTaskInput => ({
  request: { previewText, files, activeFileId, mode, validateJsonMaybeAsync },
  refs: { inputRef, fallbackContextRef, pendingOutputValue },
  applyEffects: { setPreviewValidation, onSetInput, onUpdateActiveFileContent },
});
