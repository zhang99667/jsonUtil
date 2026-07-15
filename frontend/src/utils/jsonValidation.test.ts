import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanJsonInput,
  getJsonValidationErrorLocation,
  isCleanJsonInputEmpty,
  isJsonContainerCandidate,
  startJsonValidation,
  validateJsonForEditor,
} from './jsonValidation';

describe('jsonValidation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('清理零宽字符后再校验 JSON', () => {
    const result = validateJsonForEditor('\uFEFF{"name":"json"}\u200B');

    expect(cleanJsonInput('\uFEFF{"ok":true}\u200B')).toBe('{"ok":true}');
    expect(isCleanJsonInputEmpty(cleanJsonInput(' \u200B  '))).toBe(true);
    expect(result).toEqual({ isValid: true });
  });

  it('实时编辑提示只将对象和数组视为 JSON 候选', () => {
    expect(isJsonContainerCandidate('  {"id":1}')).toBe(true);
    expect(isJsonContainerCandidate('\n[1,2,3]')).toBe(true);
    expect(isJsonContainerCandidate('"plain string"')).toBe(false);
  });

  it('非容器内容可跳过实时 JSON 错误提示', () => {
    expect(validateJsonForEditor('hello world', { requireContainer: true })).toEqual({ isValid: true });
  });

  it('预览回写校验仍会拦截非法文本', () => {
    const result = validateJsonForEditor('hello world');

    expect(result.isValid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('从普通 JSON position 错误中提取行列', () => {
    const input = '{\n  "ok": true,\n  "bad":\n}';
    const location = getJsonValidationErrorLocation(
      input,
      'Expected value in JSON at position 25'
    );

    expect(location).toEqual({ line: 4, column: 1 });
  });

  it('优先使用普通 JSON line/column 错误定位', () => {
    const location = getJsonValidationErrorLocation(
      '{"bad":}',
      "Expected value in JSON at position 7 (line 1 column 8)"
    );

    expect(location).toEqual({ line: 1, column: 8 });
  });

  it('从 JSON Lines 错误中提取实际行号与缩进列号', () => {
    const input = '{"a":1}\n  {"b":}\n{"c":3}';
    const location = getJsonValidationErrorLocation(
      input,
      'JSON Lines 第 2 行解析错误: Expected value in JSON at position 5'
    );

    expect(location).toEqual({ line: 2, column: 8 });
  });

  it('Worker 创建失败时返回可控的校验结果', async () => {
    class FailingWorker {
      constructor() {
        throw new Error('Worker 不可用');
      }
    }
    vi.stubGlobal('Worker', FailingWorker);

    const task = startJsonValidation('{"large":true}', 0);

    await expect(task.promise).resolves.toEqual({
      isValid: false,
      error: 'JSON 校验失败: Worker 不可用',
    });
    expect(() => task.cancel()).not.toThrow();
  });

  it('Worker 发送失败时终止任务并返回校验结果', async () => {
    const terminate = vi.fn();
    class PostMessageFailingWorker {
      onmessage = null;
      onerror = null;
      terminate = terminate;

      postMessage() {
        throw new Error('消息发送失败');
      }
    }
    vi.stubGlobal('Worker', PostMessageFailingWorker);

    const task = startJsonValidation('{"large":true}', 0);

    await expect(task.promise).resolves.toEqual({
      isValid: false,
      error: 'JSON 校验失败: 消息发送失败',
    });
    expect(terminate).toHaveBeenCalledTimes(1);
  });

  it('预取消信号不创建 Worker 并返回 AbortError', async () => {
    let constructionCount = 0;
    class CountingWorker {
      onmessage = null;
      onerror = null;

      constructor() {
        constructionCount++;
      }

      postMessage() {}
      terminate() {}
    }
    vi.stubGlobal('Worker', CountingWorker);
    const controller = new AbortController();
    controller.abort();

    const task = startJsonValidation('{"large":true}', 0, { signal: controller.signal });

    await expect(task.promise).rejects.toMatchObject({ name: 'AbortError' });
    expect(constructionCount).toBe(0);
  });

  it('AbortSignal 中止校验时只终止一次 Worker', async () => {
    const terminate = vi.fn();
    class PendingWorker {
      onmessage = null;
      onerror = null;
      terminate = terminate;

      postMessage() {}
    }
    vi.stubGlobal('Worker', PendingWorker);
    const controller = new AbortController();
    const task = startJsonValidation('{"large":true}', 0, { signal: controller.signal });
    const rejection = task.promise.catch(error => error);

    controller.abort();
    task.cancel();

    expect(terminate).toHaveBeenCalledTimes(1);
    await expect(rejection).resolves.toMatchObject({ name: 'AbortError' });
  });
});
