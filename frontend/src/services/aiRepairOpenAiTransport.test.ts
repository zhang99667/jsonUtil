import { describe, expect, it } from 'vitest';
import { AIProvider } from '../types';
import {
  AI_INVALID_RESPONSE_JSON_MESSAGE,
  buildChatCompletionsUrl,
  buildOpenAICompatibleRepairRequest,
  formatAiHttpErrorMessage,
  formatAiNetworkErrorMessage,
  readOpenAICompatibleRepairText,
} from './aiRepairOpenAiTransport';
import { AI_ERROR_DETAIL_REDACTION_PLACEHOLDER } from '../utils/aiProviderErrorRedaction';
import { AiRepairErrorCode, getAiRepairErrorCode } from '../utils/aiRepairErrors';
import {
  AI_REPAIR_SYSTEM_PROMPT,
  buildAiRepairUserPrompt,
} from './aiRepairPrompt';
import {
  AI_EMPTY_RESPONSE_MESSAGE,
  AI_INCOMPLETE_RESPONSE_MESSAGE,
} from './aiRepairProviderResponse';

describe('aiRepairOpenAiTransport', () => {
  it('构建 OpenAI 兼容修复请求', () => {
    const signal = new AbortController().signal;
    const request = buildOpenAICompatibleRepairRequest({
      provider: AIProvider.DEEPSEEK,
      apiKey: 'mock-key',
      model: '',
      baseUrl: 'https://mock-ai.test/v1/',
    }, '{bad:}', signal);
    const body = JSON.parse(request.requestInit.body as string);

    expect(request.requestUrl).toBe('https://mock-ai.test/v1/chat/completions');
    expect(request.requestInit).toMatchObject({
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-key',
      },
    });
    expect(body.model).toBe('deepseek-chat');
    expect(body.messages).toEqual([
      {
        role: 'system',
        content: AI_REPAIR_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: buildAiRepairUserPrompt('{bad:}'),
      },
    ]);
    expect(body.temperature).toBe(0.1);
  });

  it('用户自定义模型优先于 provider 默认模型', () => {
    const request = buildOpenAICompatibleRepairRequest({
      provider: AIProvider.QWEN,
      apiKey: 'mock-key',
      model: 'custom-repair-model',
      baseUrl: 'https://mock-ai.test/v1',
    }, '{bad:}', new AbortController().signal);
    const body = JSON.parse(request.requestInit.body as string);

    expect(body.model).toBe('custom-repair-model');
  });

  it('构建请求时裁剪 API Key 和模型名空白', () => {
    const request = buildOpenAICompatibleRepairRequest({
      provider: AIProvider.OPENAI,
      apiKey: '  mock-key\n',
      model: '  custom-repair-model  ',
      baseUrl: 'https://mock-ai.test/v1',
    }, '{bad:}', new AbortController().signal);
    const body = JSON.parse(request.requestInit.body as string);

    expect(request.requestInit.headers).toEqual({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock-key',
    });
    expect(body.model).toBe('custom-repair-model');
  });

  it('Base URL 末尾斜杠不会拼出双斜杠路径', () => {
    expect(buildChatCompletionsUrl('https://mock-ai.test/v1///'))
      .toBe('https://mock-ai.test/v1/chat/completions');
  });

  it('Base URL 已经是 chat/completions 端点时不会重复拼接路径', () => {
    expect(buildChatCompletionsUrl(' https://mock-ai.test/v1/chat/completions/ '))
      .toBe('https://mock-ai.test/v1/chat/completions');
  });

  it('Base URL 带 query 时在路径层面拼接 chat/completions', () => {
    expect(buildChatCompletionsUrl('https://proxy.test/v1?region=cn'))
      .toBe('https://proxy.test/v1/chat/completions?region=cn');
    expect(buildChatCompletionsUrl('https://proxy.test/v1/chat/completions?region=cn'))
      .toBe('https://proxy.test/v1/chat/completions?region=cn');
  });

  it('读取 OpenAI 兼容响应文本', async () => {
    const response = new Response(JSON.stringify({
      choices: [{ message: { content: '```json\n{"ok":true}\n```' } }],
    }), { status: 200 });

    await expect(readOpenAICompatibleRepairText(response))
      .resolves.toBe('```json\n{"ok":true}\n```');
  });

  it('多个 choices 时跳过空内容并读取后续文本', async () => {
    const response = new Response(JSON.stringify({
      choices: [
        { message: { content: '   ' } },
        { message: { content: '{"ok":true}' } },
      ],
    }), { status: 200 });

    await expect(readOpenAICompatibleRepairText(response))
      .resolves.toBe('{"ok":true}');
  });

  it('读取 text parts 数组形式的 OpenAI-compatible 响应文本', async () => {
    const response = new Response(JSON.stringify({
      choices: [{
        message: {
          content: [
            { type: 'tool_hint', text: '' },
            { type: 'text', text: ' {"ok":true} ' },
          ],
        },
      }],
    }), { status: 200 });

    await expect(readOpenAICompatibleRepairText(response))
      .resolves.toBe(' {"ok":true} ');
  });

  it('模型明确返回空对象时保留响应文本', async () => {
    const response = new Response(JSON.stringify({
      choices: [{ message: { content: '{}' } }],
    }), { status: 200 });

    await expect(readOpenAICompatibleRepairText(response)).resolves.toBe('{}');
  });

  it('响应被截断时拒绝使用部分文本', async () => {
    const response = new Response(JSON.stringify({
      choices: [{
        finish_reason: 'length',
        message: { content: '{"partial":' },
      }],
    }), { status: 200 });

    await expect(readOpenAICompatibleRepairText(response))
      .rejects.toThrow(`${AI_INCOMPLETE_RESPONSE_MESSAGE}（finish_reason: length）`);
  });

  it('响应被安全策略过滤时返回明确错误', async () => {
    const response = new Response(JSON.stringify({
      choices: [{ finish_reason: 'content_filter' }],
    }), { status: 200 });

    await expect(readOpenAICompatibleRepairText(response))
      .rejects.toThrow(`${AI_INCOMPLETE_RESPONSE_MESSAGE}（finish_reason: content_filter）`);
  });

  it('响应缺少内容时抛出空响应错误', async () => {
    const response = new Response(JSON.stringify({ choices: [] }), { status: 200 });

    await expect(readOpenAICompatibleRepairText(response))
      .rejects.toThrow(AI_EMPTY_RESPONSE_MESSAGE);
  });

  it('响应结构不是对象时抛出空响应错误', async () => {
    await expect(readOpenAICompatibleRepairText(
      new Response('null', { status: 200 })
    )).rejects.toThrow(AI_EMPTY_RESPONSE_MESSAGE);
    await expect(readOpenAICompatibleRepairText(
      new Response('[]', { status: 200 })
    )).rejects.toThrow(AI_EMPTY_RESPONSE_MESSAGE);
  });

  it('成功响应体不是 JSON 时抛出可读错误', async () => {
    const response = new Response('<html>not json</html>', { status: 200 });

    await expect(readOpenAICompatibleRepairText(response))
      .rejects.toThrow(AI_INVALID_RESPONSE_JSON_MESSAGE);
  });

  it('正文读取取消时原样透传 AbortError', async () => {
    const abortError = new DOMException('响应体读取已取消', 'AbortError');
    const response = new Response('{}', { status: 200 });
    Object.defineProperty(response, 'json', {
      value: () => Promise.reject(abortError),
    });

    await expect(readOpenAICompatibleRepairText(response)).rejects.toBe(abortError);
  });

  it('HTTP 错误会提取服务端详情', async () => {
    const response = new Response(JSON.stringify({
      error: {
        message: 'not found',
      },
    }), { status: 404 });

    await expect(readOpenAICompatibleRepairText(response))
      .rejects.toThrow('API 地址不存在 (404)：not found。请确认 Base URL 已填写到 OpenAI-compatible 版本路径或完整 chat/completions 端点');
  });

  it('HTTP 错误会携带结构化错误码', async () => {
    let error: unknown;
    try {
      await readOpenAICompatibleRepairText(new Response(JSON.stringify({
        error: {
          message: 'unauthorized',
        },
      }), { status: 401 }));
    } catch (caughtError) {
      error = caughtError;
    }

    expect(getAiRepairErrorCode(error)).toBe(AiRepairErrorCode.ProviderAuth);
  });

  it('HTTP 错误详情会隐藏疑似密钥和 Bearer token', async () => {
    const expectedMessage = [
      'API Key 无效或无权限：upstream rejected',
      `api_key=${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}`,
      `and Authorization: Bearer ${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}`,
    ].join(' ');
    const response = new Response(JSON.stringify({
      error: {
        message: 'upstream rejected api_key=sk-live-secret123 and Authorization: Bearer live-token-123456',
      },
    }), { status: 401 });

    await expect(readOpenAICompatibleRepairText(response))
      .rejects.toThrow(expectedMessage);
  });

  it('JSON 错误 message 过长时会脱敏并截断摘要', () => {
    const detail = `upstream api_key=sk-live-secret123 ${'x'.repeat(320)}`;
    const message = formatAiHttpErrorMessage(500, JSON.stringify({
      error: {
        message: detail,
      },
    }));

    expect(message).toContain(`upstream api_key=${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}`);
    expect(message).toContain('...');
    expect(message).not.toContain('sk-live-secret123');
    expect(message.length).toBeLessThan(300);
  });

  it('格式化非 JSON 错误体和网络错误时会隐藏敏感详情', () => {
    expect(formatAiHttpErrorMessage(500, 'proxy Authorization: Bearer gateway-token-123456'))
      .toBe(`AI 服务暂时不可用，请稍后重试：proxy Authorization: Bearer ${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}`);
    expect(formatAiNetworkErrorMessage('', 'Failed with api_key=sk-live-network123'))
      .not.toContain('sk-live-network123');
  });

  it('网络错误原始详情过长时会脱敏并截断摘要', () => {
    const message = formatAiNetworkErrorMessage(
      '',
      `Failed with api_key=sk-live-network123 ${'x'.repeat(400)}`
    );

    expect(message).toContain(`api_key=${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}`);
    expect(message).toContain('...');
    expect(message).not.toContain('sk-live-network123');
    expect(message.length).toBeLessThan(430);
  });

  it('格式化非 JSON 错误体和网络错误', () => {
    expect(formatAiHttpErrorMessage(429, 'rate limit')).toBe('API 调用频率超限，请稍后重试：rate limit');
    expect(formatAiNetworkErrorMessage('https://mock-ai.test/v1/chat/completions', 'Failed to fetch'))
      .toContain('请求地址：https://mock-ai.test/v1/chat/completions');
  });

  it('网络错误中的请求地址会隐藏 query 里的疑似密钥', () => {
    const message = formatAiNetworkErrorMessage(
      'https://proxy.example.com/v1?api_key=sk-live-url123456&region=cn/chat/completions',
      'Failed to fetch'
    );

    expect(message).toContain(`api_key=${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}`);
    expect(message).toContain('region=cn');
    expect(message).not.toContain('sk-live-url123456');
  });
});
