import { afterEach, describe, expect, it, vi } from 'vitest';
import { AIProvider } from '../types';
import {
  AI_INPUT_TOO_LARGE_MESSAGE,
  AI_REMOTE_REPAIR_MAX_INPUT_LENGTH,
  AI_CONNECTION_TEST_INVALID_MESSAGE,
  AI_CONNECTION_TEST_TIMEOUT_MESSAGE,
  AI_REPAIR_TIMEOUT_MESSAGE,
  AI_SENSITIVE_INPUT_MESSAGE,
  detectAiSensitiveInputLabels,
  fixJsonWithRepairDetails,
  fixJsonWithAI,
  testAIConnection,
} from './aiService';
import { base64Encode } from '../utils/schemeUtils';
import {
  AI_API_KEY_REQUIRED_MESSAGE,
  AI_BASE_URL_INVALID_MESSAGE,
  AI_CUSTOM_BASE_URL_REQUIRED_MESSAGE,
} from '../utils/aiProviderConfigValidation';
import { AiRepairErrorCode, getAiRepairErrorCode } from '../utils/aiRepairErrors';

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

  it('本地可修复时不会调用 AI 接口', async () => {
    const fetchImpl = vi.fn();

    await expect(fixJsonWithAI('{items:[1,2,], ok:true}', customConfig, { fetchImpl }))
      .resolves.toBe('{"items":[1,2],"ok":true}');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('本地可修复敏感字段时不发送 AI 请求', async () => {
    const fetchImpl = vi.fn();

    await expect(fixJsonWithRepairDetails('{token:"real-token", ok:true}', customConfig, { fetchImpl }))
      .resolves.toEqual({
        fixedJson: '{"token":"real-token","ok":true}',
        repairMethod: 'local',
        localRuleLabels: ['修正非标准 JSON 语法'],
      });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('本地可修复时无需 API Key', async () => {
    const fetchImpl = vi.fn();

    await expect(fixJsonWithAI('{ok:true}', {
      ...customConfig,
      apiKey: '',
    }, { fetchImpl })).resolves.toBe('{"ok":true}');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('本地不可修复且缺少 API Key 时不会发送 AI 请求', async () => {
    const fetchImpl = vi.fn();

    await expect(fixJsonWithAI('{bad}', {
      ...customConfig,
      apiKey: '  ',
    }, { fetchImpl })).rejects.toThrow(AI_API_KEY_REQUIRED_MESSAGE);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('custom provider 缺少 Base URL 时不会发送 AI 请求', async () => {
    const fetchImpl = vi.fn();

    await expect(fixJsonWithAI('{bad}', {
      ...customConfig,
      baseUrl: '  ',
    }, { fetchImpl })).rejects.toThrow(AI_CUSTOM_BASE_URL_REQUIRED_MESSAGE);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('custom provider Base URL 格式无效时不会发送 AI 请求', async () => {
    const fetchImpl = vi.fn();

    await expect(fixJsonWithAI('{bad}', {
      ...customConfig,
      baseUrl: 'mock-ai.test/v1',
    }, { fetchImpl })).rejects.toThrow(AI_BASE_URL_INVALID_MESSAGE);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('本地可修复的大输入不会进入外部模型上限判断', async () => {
    const fetchImpl = vi.fn();
    const largeValidJson = `{"value":"${'x'.repeat(AI_REMOTE_REPAIR_MAX_INPUT_LENGTH)}"}`;

    await expect(fixJsonWithAI(largeValidJson, customConfig, { fetchImpl }))
      .resolves.toBe(largeValidJson);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('本地不可修复的大输入会阻止发送原文', async () => {
    const fetchImpl = vi.fn();
    const largeBrokenJson = '{bad:}' + 'x'.repeat(AI_REMOTE_REPAIR_MAX_INPUT_LENGTH);

    await expect(fixJsonWithAI(largeBrokenJson, customConfig, { fetchImpl }))
      .rejects.toThrow(AI_INPUT_TOO_LARGE_MESSAGE);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('本地不可修复时调用 OpenAI 兼容接口并规范化 JSON 返回', async () => {
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

    await expect(fixJsonWithAI('{ok:}', customConfig, { fetchImpl }))
      .resolves.toBe('{"ok":true}');
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://mock-ai.test/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        signal: expect.any(AbortSignal),
      })
    );
  });

  it('命中敏感字段时默认阻止发送原文', async () => {
    const fetchImpl = vi.fn();

    await expect(fixJsonWithAI('{token:}', customConfig, { fetchImpl }))
      .rejects.toThrow(AI_SENSITIVE_INPUT_MESSAGE);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('本地不可修复时可识别内部 Base64 片段中的敏感字段并阻止发送', async () => {
    const extraParam = `AFD8f${base64Encode(JSON.stringify({
      oaid_v: 'real-oaid',
      akey: 'real-secret',
    }))}UxM${base64Encode('&sign=real-sign')}`;
    const fetchImpl = vi.fn();

    await expect(fixJsonWithAI(`{"extra":[{"k":"extraParam","v":"${extraParam}"}],"bad":}`, customConfig, { fetchImpl }))
      .rejects.toThrow(AI_SENSITIVE_INPUT_MESSAGE);
    expect(detectAiSensitiveInputLabels(extraParam)).toEqual(['sign', 'secret', 'device']);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('API Key 无效时返回服务端错误详情', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      error: {
        message: '无效的令牌 (request id: 2026070616260016238841890515307)',
      },
    }), { status: 401 }));

    await expect(fixJsonWithAI('{bad}', customConfig, { fetchImpl }))
      .rejects.toThrow('API Key 无效或无权限：无效的令牌 (request id: 2026070616260016238841890515307)');
  });

  it('API 地址错误时提示检查 Base URL 版本路径', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      error: {
        message: 'not found',
      },
    }), { status: 404 }));

    await expect(fixJsonWithAI('{bad}', customConfig, { fetchImpl }))
      .rejects.toThrow('API 地址不存在 (404)：not found。请确认 Base URL 已填写到 OpenAI-compatible 版本路径');
  });

  it('浏览器未拿到响应时返回可排查的网络错误', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });

    await expect(fixJsonWithAI('{bad}', customConfig, { fetchImpl }))
      .rejects.toThrow('网络连接失败：浏览器未拿到 AI 服务响应。请求地址：https://mock-ai.test/v1/chat/completions');
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

  it('外部 AbortSignal 会终止 AI 修复请求', async () => {
    const abortController = new AbortController();
    let signal: AbortSignal | undefined;
    const fetchImpl = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      signal = init?.signal;
      return new Promise<Response>(() => undefined);
    });

    void fixJsonWithAI('{bad}', customConfig, {
      fetchImpl,
      signal: abortController.signal,
    }).catch(() => undefined);

    abortController.abort();

    expect(signal?.aborted).toBe(true);
  });

  it('连接测试会调用 OpenAI 兼容接口', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      choices: [
        {
          message: {
            content: '{"connection":true}',
          },
        },
      ],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    await expect(testAIConnection(customConfig, { fetchImpl })).resolves.toBeUndefined();
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://mock-ai.test/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        signal: expect.any(AbortSignal),
      })
    );
  });

  it('连接测试返回无关 JSON 时提示模型配置异常', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      choices: [
        {
          message: {
            content: '{}',
          },
        },
      ],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    await expect(testAIConnection(customConfig, { fetchImpl }))
      .rejects.toThrow(AI_CONNECTION_TEST_INVALID_MESSAGE);
  });

  it('OpenAI 兼容 Base URL 带尾部斜杠时不会拼出双斜杠路径', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      choices: [
        {
          message: {
            content: '{"ok":true}',
          },
        },
      ],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    await expect(fixJsonWithAI('{ok:}', {
      ...customConfig,
      baseUrl: 'https://mock-ai.test/v1/',
    }, { fetchImpl })).resolves.toBe('{"ok":true}');

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://mock-ai.test/v1/chat/completions',
      expect.any(Object)
    );
  });

  it('连接测试超时时返回连接测试提示', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(() => new Promise<Response>(() => undefined));

    const promise = testAIConnection(customConfig, {
      fetchImpl,
      timeoutMs: 1000,
    });
    const expectation = expect(promise).rejects.toThrow(AI_CONNECTION_TEST_TIMEOUT_MESSAGE);

    await vi.advanceTimersByTimeAsync(1000);

    await expectation;
  });

  it('连接测试超时时携带连接测试错误码', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(() => new Promise<Response>(() => undefined));
    let error: unknown;

    const promise = testAIConnection(customConfig, {
      fetchImpl,
      timeoutMs: 1000,
    }).catch(caughtError => {
      error = caughtError;
    });

    await vi.advanceTimersByTimeAsync(1000);
    await promise;

    expect(getAiRepairErrorCode(error)).toBe(AiRepairErrorCode.ConnectionTestTimeout);
  });
});
