import { afterEach, describe, expect, it, vi } from 'vitest';
import { AIProvider } from '../types';
import {
  AI_REPAIR_TIMEOUT_MESSAGE,
  fixJsonWithAI,
  normalizeAiJsonResponse,
} from './aiService';

describe('normalizeAiJsonResponse', () => {
  it('直接返回压缩后的有效 JSON', () => {
    expect(normalizeAiJsonResponse('{ "name": "json", "ok": true }')).toBe('{"name":"json","ok":true}');
  });

  it('支持提取 Markdown 代码块中的 JSON', () => {
    const response = '修复结果如下：\n```json\n{ "items": [1, 2] }\n```';
    expect(normalizeAiJsonResponse(response)).toBe('{"items":[1,2]}');
  });

  it('支持从解释文本中提取第一个完整 JSON 片段', () => {
    const response = '已修复：{"nested":{"value":"ok"}}，请确认。';
    expect(normalizeAiJsonResponse(response)).toBe('{"nested":{"value":"ok"}}');
  });

  it('空返回回退为空对象', () => {
    expect(normalizeAiJsonResponse('   ')).toBe('{}');
  });

  it('无有效 JSON 时抛出可读错误', () => {
    expect(() => normalizeAiJsonResponse('无法修复这段内容')).toThrow('AI 返回内容不是有效 JSON');
  });
});

describe('fixJsonWithAI', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const customConfig = {
    provider: AIProvider.CUSTOM,
    apiKey: 'mock-key',
    model: 'mock-json-repair',
    baseUrl: 'https://mock-ai.test/v1',
  };

  it('调用 OpenAI 兼容接口并规范化 JSON 返回', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      choices: [
        {
          message: {
            content: '```json\n{ "ok": true }\n```',
          },
        },
      ],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    await expect(fixJsonWithAI('{ok:true}', customConfig, { fetchImpl }))
      .resolves.toBe('{"ok":true}');
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://mock-ai.test/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        signal: expect.any(AbortSignal),
      })
    );
  });

  it('API Key 无效时返回友好错误', async () => {
    const fetchImpl = vi.fn(async () => new Response('unauthorized', { status: 401 }));

    await expect(fixJsonWithAI('{bad}', customConfig, { fetchImpl }))
      .rejects.toThrow('API Key 无效，请检查配置');
  });

  it('接口长时间无响应时超时并终止请求', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const fetchImpl = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      signal = init?.signal;
      return new Promise<Response>(() => undefined);
    });

    const promise = fixJsonWithAI('{bad}', customConfig, {
      fetchImpl,
      timeoutMs: 1000,
    });
    const expectation = expect(promise).rejects.toThrow(AI_REPAIR_TIMEOUT_MESSAGE);

    await vi.advanceTimersByTimeAsync(1000);

    await expectation;
    expect(signal?.aborted).toBe(true);
  });
});
