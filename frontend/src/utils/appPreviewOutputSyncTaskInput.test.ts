import { describe, expect, it, vi } from 'vitest';
import { TransformMode, type TransformContext } from '../types';
import { buildAppPreviewOutputSyncTaskInput } from './appPreviewOutputSyncTaskInput';
import type { AppPreviewOutputSyncTaskFlatInput } from './appPreviewOutputSyncTaskTypes';

describe('appPreviewOutputSyncTaskInput', () => {
  it('把平铺 PREVIEW 同步输入显式分桶为 request、refs 和 applyEffects', () => {
    const inputRef = { current: '{"a":1}' };
    const fallbackContextRef = { current: { timestamp: 1 } as TransformContext };
    const pendingOutputValue = { current: '{"a":2}' };
    const setPreviewValidation = vi.fn();
    const onSetInput = vi.fn();
    const onUpdateActiveFileContent = vi.fn();
    const validateJsonMaybeAsync = vi.fn();

    const input: AppPreviewOutputSyncTaskFlatInput = {
      previewText: '{"preview":true}',
      files: [],
      activeFileId: 'file-a',
      mode: TransformMode.FORMAT,
      validateJsonMaybeAsync,
      inputRef,
      fallbackContextRef,
      pendingOutputValue,
      setPreviewValidation,
      onSetInput,
      onUpdateActiveFileContent,
    };

    expect(buildAppPreviewOutputSyncTaskInput(input)).toEqual({
      request: {
        previewText: '{"preview":true}',
        files: [],
        activeFileId: 'file-a',
        mode: TransformMode.FORMAT,
        validateJsonMaybeAsync,
      },
      refs: { inputRef, fallbackContextRef, pendingOutputValue },
      applyEffects: { setPreviewValidation, onSetInput, onUpdateActiveFileContent },
    });
  });
});
