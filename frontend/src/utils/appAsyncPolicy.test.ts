import { describe, expect, it } from 'vitest';
import { TransformMode } from '../types';
import {
  ASYNC_TRANSFORM_PLACEHOLDER,
  ASYNC_TRANSFORM_THRESHOLD,
  ASYNC_VALIDATION_THRESHOLD,
  DOCUMENT_STATS_SCAN_LIMIT,
  buildAppAsyncTransformPolicy,
} from './appAsyncPolicy';

describe('appAsyncPolicy', () => {
  it('保留主线程性能阈值常量', () => {
    expect(ASYNC_TRANSFORM_THRESHOLD).toBe(200_000);
    expect(ASYNC_VALIDATION_THRESHOLD).toBe(200_000);
    expect(DOCUMENT_STATS_SCAN_LIMIT).toBe(300_000);
    expect(ASYNC_TRANSFORM_PLACEHOLDER).toBe('// 正在处理，请稍候...');
  });

  it('大输入且支持的转换模式走 Worker', () => {
    expect(buildAppAsyncTransformPolicy({
      input: 'x'.repeat(ASYNC_TRANSFORM_THRESHOLD),
      mode: TransformMode.DEEP_FORMAT,
      isUpdatingFromOutput: false,
    })).toMatchObject({
      shouldUseTransformWorker: true,
      shouldUseAsyncTransform: true,
      isSourceLarge: true,
    });
  });

  it('输出同步回写期间不触发异步转换', () => {
    expect(buildAppAsyncTransformPolicy({
      input: 'x'.repeat(ASYNC_TRANSFORM_THRESHOLD),
      mode: TransformMode.FORMAT,
      isUpdatingFromOutput: true,
    })).toMatchObject({
      shouldUseTransformWorker: false,
      shouldUseDynamicTransform: false,
      shouldUseAsyncTransform: false,
      isSourceLarge: true,
    });
  });

  it('TypeScript 类型生成使用动态异步路径', () => {
    expect(buildAppAsyncTransformPolicy({
      input: '{"a":1}',
      mode: TransformMode.JSON_TO_TYPESCRIPT,
      isUpdatingFromOutput: false,
    })).toMatchObject({
      shouldUseTransformWorker: false,
      shouldUseDynamicTransform: true,
      shouldUseAsyncTransform: true,
      isSourceLarge: false,
    });
  });

  it('普通小输入和空白类型生成不走异步路径', () => {
    expect(buildAppAsyncTransformPolicy({
      input: '{"a":1}',
      mode: TransformMode.FORMAT,
      isUpdatingFromOutput: false,
    }).shouldUseAsyncTransform).toBe(false);
    expect(buildAppAsyncTransformPolicy({
      input: '   ',
      mode: TransformMode.JSON_TO_TYPESCRIPT,
      isUpdatingFromOutput: false,
    }).shouldUseAsyncTransform).toBe(false);
  });
});
