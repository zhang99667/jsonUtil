import { describe, expect, it, vi } from 'vitest';
import { TransformMode, type ValidationResult } from '../types';
import {
  executeAppPreviewOutputSync,
  PREVIEW_OUTPUT_SYNC_FAILED,
} from './appPreviewOutputSyncRunner';

const validResult: ValidationResult = { isValid: true };
const invalidResult: ValidationResult = { isValid: false, error: 'preview invalid' };

describe('appPreviewOutputSyncRunner', () => {
  it('格式化类 PREVIEW 校验失败时返回 invalid 结果', async () => {
    const validateJsonMaybeAsync = vi.fn(async () => invalidResult);

    await expect(executeAppPreviewOutputSync({
      previewText: '{bad',
      mode: TransformMode.FORMAT,
      originalInput: '{"a":1}',
      context: null,
      validateJsonMaybeAsync,
    })).resolves.toEqual({
      status: 'invalid',
      validation: invalidResult,
    });
  });

  it('格式化类 PREVIEW 校验通过后生成 SOURCE 回写值', async () => {
    const validateJsonMaybeAsync = vi.fn(async () => validResult);

    const result = await executeAppPreviewOutputSync({
      previewText: '{\n  "a": 2\n}',
      mode: TransformMode.FORMAT,
      originalInput: 'while(1);{"a":1}',
      context: null,
      validateJsonMaybeAsync,
    });

    expect(validateJsonMaybeAsync).toHaveBeenCalledWith('{\n  "a": 2\n}');
    expect(result).toEqual({
      status: 'synced',
      nextSource: 'while(1);{"a":2}',
    });
  });

  it('格式化类 PREVIEW 校验异常时返回 failed 结果', async () => {
    const validateJsonMaybeAsync = vi.fn(async () => {
      throw new Error('validation worker crashed');
    });

    await expect(executeAppPreviewOutputSync({
      previewText: '{"a":2}',
      mode: TransformMode.FORMAT,
      originalInput: '{"a":1}',
      context: null,
      validateJsonMaybeAsync,
    })).resolves.toEqual({
      status: 'failed',
      validation: PREVIEW_OUTPUT_SYNC_FAILED,
    });
  });

  it('非格式化类 PREVIEW 直接反向转换且不触发 JSON 校验', async () => {
    const validateJsonMaybeAsync = vi.fn(async () => validResult);

    const result = await executeAppPreviewOutputSync({
      previewText: 'plain text',
      mode: TransformMode.NONE,
      originalInput: '{"a":1}',
      context: null,
      validateJsonMaybeAsync,
    });

    expect(validateJsonMaybeAsync).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 'synced',
      nextSource: 'plain text',
    });
  });
});
