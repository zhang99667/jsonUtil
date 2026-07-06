import { vi } from 'vitest';
import { TransformMode, type TransformContext } from '../types';
import type {
  AppPreviewOutputChangeTaskInput,
  AppPreviewOutputSyncTaskApplyEffects,
  AppPreviewOutputSyncTaskInput,
  AppPreviewOutputSyncTaskRefs,
  AppPreviewOutputSyncTaskRequest,
  SchedulePreviewOutputSync,
} from './appPreviewOutputSyncTaskTypes';

export const PREVIEW_OUTPUT_SYNC_PREVIEW_TEXT = '{"a":2}';
export const PREVIEW_OUTPUT_SYNC_SOURCE_TEXT = '{"a":1}';

type PreviewOutputSyncInputOverrides = {
  request?: Partial<AppPreviewOutputSyncTaskRequest>;
  refs?: Partial<AppPreviewOutputSyncTaskRefs>;
  applyEffects?: Partial<AppPreviewOutputSyncTaskApplyEffects>;
};

type PreviewOutputChangeTaskInputOverrides = PreviewOutputSyncInputOverrides & {
  scheduleOutputSync?: SchedulePreviewOutputSync;
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
