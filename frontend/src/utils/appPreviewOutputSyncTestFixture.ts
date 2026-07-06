import { vi } from 'vitest';
import { TransformMode, type TransformContext } from '../types';
import type { AppPreviewOutputChangeTaskInput } from './appPreviewOutputChangeTask';
import type {
  AppPreviewOutputSyncTaskApplyEffects,
  AppPreviewOutputSyncTaskInput,
  AppPreviewOutputSyncTaskRefs,
  AppPreviewOutputSyncTaskRequest,
  PreviewOutputSyncTask,
} from './appPreviewOutputSyncTaskTypes';

export const PREVIEW_OUTPUT_SYNC_PREVIEW_TEXT = '{"a":2}';
export const PREVIEW_OUTPUT_SYNC_SOURCE_TEXT = '{"a":1}';

type PreviewOutputSyncInputOverrides = {
  request?: Partial<AppPreviewOutputSyncTaskRequest>;
  refs?: Partial<AppPreviewOutputSyncTaskRefs>;
  applyEffects?: Partial<AppPreviewOutputSyncTaskApplyEffects>;
};

type PreviewOutputChangeTaskInputOverrides = PreviewOutputSyncInputOverrides & {
  scheduleOutputSync?: (task: PreviewOutputSyncTask) => void;
};

export const createPreviewOutputSyncTaskInput = ({
  request,
  refs,
  applyEffects,
}: PreviewOutputSyncInputOverrides = {}): AppPreviewOutputSyncTaskInput => ({
  request: {
    previewText: PREVIEW_OUTPUT_SYNC_PREVIEW_TEXT,
    files: [],
    activeFileId: null,
    mode: TransformMode.FORMAT,
    validateJsonMaybeAsync: vi.fn(),
    ...request,
  },
  refs: {
    inputRef: { current: PREVIEW_OUTPUT_SYNC_SOURCE_TEXT },
    fallbackContextRef: { current: null as TransformContext | null },
    pendingOutputValue: { current: '' },
    ...refs,
  },
  applyEffects: {
    setPreviewValidation: vi.fn(),
    onSetInput: vi.fn(),
    onUpdateActiveFileContent: vi.fn(),
    ...applyEffects,
  },
});

export const createPreviewOutputChangeTaskInput = ({
  scheduleOutputSync,
  ...syncOverrides
}: PreviewOutputChangeTaskInputOverrides = {}): AppPreviewOutputChangeTaskInput => {
  const { request, refs, applyEffects } = createPreviewOutputSyncTaskInput(syncOverrides);

  return {
    ...request,
    ...refs,
    ...applyEffects,
    scheduleOutputSync: scheduleOutputSync ?? vi.fn(),
  };
};

export const buildExpectedPreviewOutputSyncTaskInput = ({
  previewText, files, activeFileId, mode, validateJsonMaybeAsync,
  inputRef, fallbackContextRef, pendingOutputValue,
  setPreviewValidation, onSetInput, onUpdateActiveFileContent,
}: AppPreviewOutputChangeTaskInput): AppPreviewOutputSyncTaskInput => ({
  request: { previewText, files, activeFileId, mode, validateJsonMaybeAsync },
  refs: { inputRef, fallbackContextRef, pendingOutputValue },
  applyEffects: { setPreviewValidation, onSetInput, onUpdateActiveFileContent },
});
