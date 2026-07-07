import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AIProvider } from '../types';
import {
  AI_REPAIR_TIMEOUT_MESSAGE,
  requestAiRepairProviderText,
} from './aiRepairProviderClient';
import { requestGeminiRepairText } from './aiRepairGeminiTransport';
import { AI_ERROR_DETAIL_REDACTION_PLACEHOLDER } from '../utils/aiProviderErrorRedaction';
import { AiRepairErrorCode, createAiRepairError, getAiRepairErrorCode } from '../utils/aiRepairErrors';

vi.mock('./aiRepairGeminiTransport', () => ({
  requestGeminiRepairText: vi.fn(),
}));

describe('aiRepairProviderClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('Gemini provider 走 Gemini transport', async () => {
    vi.mocked(requestGeminiRepairText).mockResolvedValue('{"ok":true}');
    const config = {
      provider: AIProvider.GEMINI,
      apiKey: 'mock-key',
      model: 'gemini-custom',
    };

    await expect(requestAiRepairProviderText('{bad:}', config))
      .resolves.toBe('{"ok":true}');
    expect(requestGeminiRepairText).toHaveBeenCalledWith(config, '{bad:}', expect.any(AbortSignal));
  });

  it('Gemini provider 超时时会终止底层请求', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    vi.mocked(requestGeminiRepairText).mockImplementation((_config, _brokenJson, requestSignal) => {
      signal = requestSignal;
      return new Promise<string>(() => undefined);
    });

    const promise = requestAiRepairProviderText('{bad:}', {
      provider: AIProvider.GEMINI,
      apiKey: 'mock-key',
      model: 'gemini-custom',
    }, {
      timeoutMs: 1000,
    });
    const expectation = expect(promise).rejects.toThrow(AI_REPAIR_TIMEOUT_MESSAGE);

    await vi.advanceTimersByTimeAsync(1000);

    await expectation;
    expect(signal?.aborted).toBe(true);
  });

  it('Gemini provider 会响应外部 AbortSignal', async () => {
    const abortController = new AbortController();
    let signal: AbortSignal | undefined;
    vi.mocked(requestGeminiRepairText).mockImplementation((_config, _brokenJson, requestSignal) => {
      signal = requestSignal;
      return new Promise<string>(() => undefined);
    });

    void requestAiRepairProviderText('{bad:}', {
      provider: AIProvider.GEMINI,
      apiKey: 'mock-key',
      model: 'gemini-custom',
    }, {
      signal: abortController.signal,
    }).catch(() => undefined);

    abortController.abort();

    expect(signal?.aborted).toBe(true);
  });

  it('provider 错误日志和最终错误会隐藏敏感详情', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(requestGeminiRepairText).mockRejectedValue(
      new Error('Gemini SDK rejected api_key=sk-live-secret123')
    );

    await expect(requestAiRepairProviderText('{bad:}', {
      provider: AIProvider.GEMINI,
      apiKey: 'mock-key',
      model: 'gemini-custom',
    })).rejects.toThrow(`AI 修复失败: Gemini SDK rejected api_key=${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}`);

    expect(consoleError).toHaveBeenCalledWith(
      'Error calling AI API:',
      `Gemini SDK rejected api_key=${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}`
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain('sk-live-secret123');
    consoleError.mockRestore();
  });

  it('未知 provider 长错误会脱敏并截断摘要', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(requestGeminiRepairText).mockRejectedValue(
      new Error(`Gemini SDK rejected api_key=sk-live-secret123 ${'x'.repeat(400)}`)
    );
    let error: unknown;

    try {
      await requestAiRepairProviderText('{bad:}', {
        provider: AIProvider.GEMINI,
        apiKey: 'mock-key',
        model: 'gemini-custom',
      });
    } catch (caughtError) {
      error = caughtError;
    }

    const message = error instanceof Error ? error.message : '';
    const loggedSummary = consoleError.mock.calls[0]?.[1] as string;
    expect(message).toContain(`AI 修复失败: Gemini SDK rejected api_key=${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}`);
    expect(message).toContain('...');
    expect(message).not.toContain('sk-live-secret123');
    expect(message.length).toBeLessThan(280);
    expect(loggedSummary).toContain(`api_key=${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}`);
    expect(loggedSummary).toContain('...');
    expect(loggedSummary).not.toContain('sk-live-secret123');
    expect(loggedSummary.length).toBeLessThan(250);
    consoleError.mockRestore();
  });

  it('已归一化的 provider 业务错误不会重复输出 console.error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(requestGeminiRepairText).mockRejectedValue(
      createAiRepairError(AiRepairErrorCode.ProviderAuth, 'API Key 无效或无权限')
    );

    await expect(requestAiRepairProviderText('{bad:}', {
      provider: AIProvider.GEMINI,
      apiKey: 'mock-key',
      model: 'gemini-custom',
    })).rejects.toThrow('API Key 无效或无权限');

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('Gemini SDK 鉴权状态错误会归一为 ProviderAuth 且不重复输出 console.error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(requestGeminiRepairText).mockRejectedValue(
      Object.assign(new Error('Gemini rejected api_key=sk-live-secret123'), { status: 401 })
    );
    let error: unknown;

    try {
      await requestAiRepairProviderText('{bad:}', {
        provider: AIProvider.GEMINI,
        apiKey: 'mock-key',
        model: 'gemini-custom',
      });
    } catch (caughtError) {
      error = caughtError;
    }

    const message = error instanceof Error ? error.message : '';
    expect(getAiRepairErrorCode(error)).toBe(AiRepairErrorCode.ProviderAuth);
    expect(message).toContain(`api_key=${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}`);
    expect(message).not.toContain('sk-live-secret123');
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('Gemini SDK 限流和服务错误会归一为对应 provider 错误码', async () => {
    vi.mocked(requestGeminiRepairText).mockRejectedValueOnce(
      Object.assign(new Error('quota exceeded'), { statusCode: '429' })
    ).mockRejectedValueOnce(
      new Error('upstream failed with code: 503')
    );

    await expect(requestAiRepairProviderText('{bad:}', {
      provider: AIProvider.GEMINI,
      apiKey: 'mock-key',
      model: 'gemini-custom',
    })).rejects.toMatchObject({
      code: AiRepairErrorCode.ProviderRateLimit,
      message: 'API 调用频率超限，请稍后重试：quota exceeded',
    });

    await expect(requestAiRepairProviderText('{bad:}', {
      provider: AIProvider.GEMINI,
      apiKey: 'mock-key',
      model: 'gemini-custom',
    })).rejects.toMatchObject({
      code: AiRepairErrorCode.ProviderUnavailable,
      message: 'AI 服务暂时不可用，请稍后重试：upstream failed with code: 503',
    });
  });

  it('OpenAI-compatible provider 读取响应文本', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: '{"ok":true}' } }],
    }), { status: 200 }));

    await expect(requestAiRepairProviderText('{bad:}', {
      provider: AIProvider.CUSTOM,
      apiKey: 'mock-key',
      model: 'mock-model',
      baseUrl: 'https://mock-ai.test/v1',
    }, { fetchImpl })).resolves.toBe('{"ok":true}');
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://mock-ai.test/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        signal: expect.any(AbortSignal),
      })
    );
  });

  it('OpenAI-compatible 网络错误包含请求地址', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });

    await expect(requestAiRepairProviderText('{bad:}', {
      provider: AIProvider.CUSTOM,
      apiKey: 'mock-key',
      model: 'mock-model',
      baseUrl: 'https://mock-ai.test/v1',
    }, { fetchImpl })).rejects.toThrow(
      '网络连接失败：浏览器未拿到 AI 服务响应。请求地址：https://mock-ai.test/v1/chat/completions'
    );
  });

  it('OpenAI-compatible 识别 Safari 风格网络错误', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('Load failed');
    });

    await expect(requestAiRepairProviderText('{bad:}', {
      provider: AIProvider.CUSTOM,
      apiKey: 'mock-key',
      model: 'mock-model',
      baseUrl: 'https://mock-ai.test/v1',
    }, { fetchImpl })).rejects.toThrow(
      '网络连接失败：浏览器未拿到 AI 服务响应。请求地址：https://mock-ai.test/v1/chat/completions'
    );
  });

  it('OpenAI-compatible AbortError 会归一为超时提示', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new DOMException('The operation was aborted.', 'AbortError');
    });

    await expect(requestAiRepairProviderText('{bad:}', {
      provider: AIProvider.CUSTOM,
      apiKey: 'mock-key',
      model: 'mock-model',
      baseUrl: 'https://mock-ai.test/v1',
    }, { fetchImpl })).rejects.toThrow(AI_REPAIR_TIMEOUT_MESSAGE);
  });

  it('OpenAI-compatible 超时时终止请求', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const fetchImpl = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      signal = init?.signal;
      return new Promise<Response>(() => undefined);
    });

    const promise = requestAiRepairProviderText('{bad:}', {
      provider: AIProvider.CUSTOM,
      apiKey: 'mock-key',
      model: 'mock-model',
      baseUrl: 'https://mock-ai.test/v1',
    }, {
      fetchImpl,
      timeoutMs: 1000,
    });
    const expectation = expect(promise).rejects.toThrow(AI_REPAIR_TIMEOUT_MESSAGE);

    await vi.advanceTimersByTimeAsync(1000);

    await expectation;
    expect(signal?.aborted).toBe(true);
  });

  it('OpenAI-compatible 会响应外部 AbortSignal', async () => {
    const abortController = new AbortController();
    let signal: AbortSignal | undefined;
    const fetchImpl = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      signal = init?.signal;
      return new Promise<Response>(() => undefined);
    });

    void requestAiRepairProviderText('{bad:}', {
      provider: AIProvider.CUSTOM,
      apiKey: 'mock-key',
      model: 'mock-model',
      baseUrl: 'https://mock-ai.test/v1',
    }, {
      fetchImpl,
      signal: abortController.signal,
    }).catch(() => undefined);

    abortController.abort();

    expect(signal?.aborted).toBe(true);
  });
});
