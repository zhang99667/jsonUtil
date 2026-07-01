import { describe, expect, it } from 'vitest';
import { TransformMode } from '../types';
import { buildAppAsyncTransformSnapshot } from './appAsyncTransformSnapshot';
import { buildAppAsyncTransformWorkerRequest } from './appAsyncTransformWorkerMessages';

describe('appAsyncTransformWorkerMessages', () => {
  it('基于异步转换 snapshot 构造 Worker 请求', () => {
    const snapshot = buildAppAsyncTransformSnapshot('{"a":1}', TransformMode.DEEP_FORMAT, true);

    expect(buildAppAsyncTransformWorkerRequest(7, snapshot)).toEqual({
      id: 7,
      input: '{"a":1}',
      mode: TransformMode.DEEP_FORMAT,
      options: { autoExpandScheme: true },
    });
  });
});
