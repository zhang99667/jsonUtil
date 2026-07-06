import { afterEach, describe, expect, it, vi } from 'vitest';
import { AIProvider } from '../types';
import {
  AI_CONNECTION_TEST_TIMEOUT_MESSAGE,
  AI_REPAIR_TIMEOUT_MESSAGE,
  AI_SENSITIVE_INPUT_MESSAGE,
  detectAiSensitiveInputLabels,
  fixJsonWithRepairDetails,
  fixJsonWithAI,
  normalizeAiJsonResponse,
  repairJsonLocally,
  repairJsonLocallyWithReport,
  testAIConnection,
} from './aiService';
import { base64Encode } from '../utils/schemeUtils';

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

  it('本地修复常见 JSON 小错误', () => {
    expect(repairJsonLocally(`// comment
      {items:[1,2,], ok:true, name:'json', note:"line
      break"}`)).toBe('{"items":[1,2],"ok":true,"name":"json","note":"line\\n      break"}');
  });

  it('本地修复会返回命中的确定性规则', () => {
    expect(repairJsonLocallyWithReport(`// comment
      {items:[1,2,], note:"line
      break"}`)).toEqual({
      fixedJson: '{"items":[1,2],"note":"line\\n      break"}',
      ruleLabels: [
        '移除 JSON 注释',
        '修正常见 JS 对象写法',
        '移除尾随逗号',
        '转义字符串内换行/控制字符',
      ],
    });
  });

  it('本地修复不会移除字符串内的注释符和尾随逗号样式文本', () => {
    expect(repairJsonLocally(
      '{url:"https://example.com/a//b", block:"/* keep */", tail:",]", brace:",}", ok:true,}'
    )).toBe(
      '{"url":"https://example.com/a//b","block":"/* keep */","tail":",]","brace":",}","ok":true}'
    );
  });

  it('本地修复不会被字符串内的转义引号和注释符提前截断', () => {
    expect(repairJsonLocally(
      '{text:"before \\"// still text\\" after", ok:true}'
    )).toBe('{"text":"before \\"// still text\\" after","ok":true}');
  });

  it('本地修复不会给字符串内容里的裸 key 文本补引号', () => {
    expect(repairJsonLocally(
      '{text:"literal {bare:1, next:2}", ok:true}'
    )).toBe('{"text":"literal {bare:1, next:2}","ok":true}');
  });

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
        localRuleLabels: ['修正常见 JS 对象写法'],
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

  it('可识别 URL 编码后的敏感字段', () => {
    const encoded = `payload=${encodeURIComponent(JSON.stringify({
      sign: 'real-sign',
      device_id: 'real-device',
    }))}`;

    expect(detectAiSensitiveInputLabels(encoded)).toEqual(['sign', 'device']);
  });

  it('可识别多层 URL 编码后的敏感字段', () => {
    const payload = JSON.stringify({
      token: 'real-token',
      android_id: 'real-android-id',
    });
    const encoded = `task_params=${encodeURIComponent(encodeURIComponent(encodeURIComponent(payload)))}`;

    expect(detectAiSensitiveInputLabels(encoded)).toEqual(['token', 'device']);
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

  it('OpenAI 兼容 Base URL 只填根域名时自动补齐 v1 路径', async () => {
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
      baseUrl: 'https://mock-ai.test',
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
});
