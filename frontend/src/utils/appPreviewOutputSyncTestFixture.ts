import { vi } from 'vitest';
import { TransformMode, type TransformContext } from '../types';
import type {
  AppPreviewOutputChangeTaskInput,
  AppPreviewOutputSyncTaskFlatInput,
  AppPreviewOutputSyncTaskInput,
  SchedulePreviewOutputSync,
} from './appPreviewOutputSyncTaskTypes';

export const PREVIEW_OUTPUT_SYNC_PREVIEW_TEXT = '{"a":2}';
export const PREVIEW_OUTPUT_SYNC_SOURCE_TEXT = '{"a":1}';

type PreviewOutputSyncInputOverrides = {
  [Key in keyof AppPreviewOutputSyncTaskInput]?: Partial<AppPreviewOutputSyncTaskInput[Key]>;
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

export const createPreviewOutputSyncTaskFlatInput = (
  overrides: PreviewOutputSyncInputOverrides = {}
): AppPreviewOutputSyncTaskFlatInput => {
  const { request, refs, applyEffects } = createPreviewOutputSyncTaskInput(overrides);
  return { ...request, ...refs, ...applyEffects };
};

export const createPreviewOutputChangeTaskInput = ({
  scheduleOutputSync,
  ...syncOverrides
}: PreviewOutputChangeTaskInputOverrides = {}): AppPreviewOutputChangeTaskInput => {
  return {
    ...createPreviewOutputSyncTaskFlatInput(syncOverrides),
    scheduleOutputSync: scheduleOutputSync ?? vi.fn(),
  };
};
