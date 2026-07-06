import { vi } from 'vitest';
import { TransformMode, type TransformContext } from '../types';
import type { AppPreviewOutputChangeHandlerInput } from './appPreviewOutputChangeHandler';
import type { AppPreviewOutputChangeTaskInput } from './appPreviewOutputChangeTask';
import type {
  AppPreviewOutputSyncTaskApplyEffects,
  AppPreviewOutputSyncTaskInput,
  AppPreviewOutputSyncTaskRefs,
  AppPreviewOutputSyncTaskRequest,
  PreviewOutputSyncTask,
} from './appPreviewOutputSyncTaskTypes';
import type { MutableValueRef } from './mutableValueRef';

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

type PreviewOutputChangeHandlerInputOverrides = PreviewOutputChangeTaskInputOverrides & {
  isUpdatingFromOutput?: MutableValueRef<boolean>;
  updatePreviewValidation?: (previewText: string) => void;
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

export const createPreviewOutputChangeHandlerInput = ({
  isUpdatingFromOutput,
  updatePreviewValidation,
  ...taskOverrides
}: PreviewOutputChangeHandlerInputOverrides = {}): AppPreviewOutputChangeHandlerInput => {
  const { previewText, ...handlerInput } = createPreviewOutputChangeTaskInput(taskOverrides);
  void previewText;

  return {
    ...handlerInput,
    isUpdatingFromOutput: isUpdatingFromOutput ?? { current: false },
    updatePreviewValidation: updatePreviewValidation ?? vi.fn(),
  };
};
