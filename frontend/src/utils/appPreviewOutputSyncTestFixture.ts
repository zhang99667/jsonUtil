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

export const createPreviewOutputSyncTaskFlatInput = ({
  request,
  refs,
  applyEffects,
}: PreviewOutputSyncInputOverrides = {}): AppPreviewOutputSyncTaskFlatInput => ({
  previewText: PREVIEW_OUTPUT_SYNC_PREVIEW_TEXT,
  files: [],
  activeFileId: null,
  mode: TransformMode.FORMAT,
  validateJsonMaybeAsync: vi.fn(),
  ...request,
  inputRef: { current: PREVIEW_OUTPUT_SYNC_SOURCE_TEXT },
  fallbackContextRef: { current: null as TransformContext | null },
  pendingOutputValue: { current: '' },
  ...refs,
  setPreviewValidation: vi.fn(),
  onSetInput: vi.fn(),
  onUpdateActiveFileContent: vi.fn(),
  ...applyEffects,
});

export const createPreviewOutputSyncTaskInput = (
  overrides: PreviewOutputSyncInputOverrides = {}
): AppPreviewOutputSyncTaskInput => {
  const {
    previewText, files, activeFileId, mode, validateJsonMaybeAsync,
    inputRef, fallbackContextRef, pendingOutputValue,
    setPreviewValidation, onSetInput, onUpdateActiveFileContent,
  } = createPreviewOutputSyncTaskFlatInput(overrides);
  return {
    request: { previewText, files, activeFileId, mode, validateJsonMaybeAsync },
    refs: { inputRef, fallbackContextRef, pendingOutputValue },
    applyEffects: { setPreviewValidation, onSetInput, onUpdateActiveFileContent },
  };
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
