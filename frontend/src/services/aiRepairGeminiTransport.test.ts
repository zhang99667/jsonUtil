import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AIProvider } from '../types';
import {
  GEMINI_REPAIR_DEFAULT_MODEL,
  buildGeminiRepairPrompt,
  getGeminiRepairModel,
  requestGeminiRepairText,
} from './aiRepairGeminiTransport';
import { buildAiRepairPrompt } from './aiRepairPrompt';
import {
  AI_EMPTY_RESPONSE_MESSAGE,
  AI_INCOMPLETE_RESPONSE_MESSAGE,
} from './aiRepairProviderResponse';

const genaiMocks = vi.hoisted(() => ({
  generateContent: vi.fn(),
  GoogleGenAI: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: genaiMocks.GoogleGenAI,
}));

describe('aiRepairGeminiTransport', () => {
  beforeEach(() => {
    genaiMocks.generateContent.mockReset();
    genaiMocks.GoogleGenAI.mockReset();
    genaiMocks.GoogleGenAI.mockImplementation(function () {
      return {
      models: {
        generateContent: genaiMocks.generateContent,
      },
      };
    });
  });

  it('构建 Gemini 修复 prompt', () => {
    const prompt = buildGeminiRepairPrompt('{bad:}');

    expect(prompt).toBe(buildAiRepairPrompt('{bad:}'));
  });

  it('空模型时使用 Gemini 默认修复模型', () => {
    expect(getGeminiRepairModel({
      provider: AIProvider.GEMINI,
      apiKey: 'mock-key',
      model: '',
    })).toBe(GEMINI_REPAIR_DEFAULT_MODEL);
  });

  it('空白模型时使用 Gemini 默认修复模型', () => {
    expect(getGeminiRepairModel({
      provider: AIProvider.GEMINI,
      apiKey: 'mock-key',
      model: '   ',
    })).toBe(GEMINI_REPAIR_DEFAULT_MODEL);
  });

  it('调用 Google GenAI SDK 并读取文本响应', async () => {
    genaiMocks.generateContent.mockResolvedValue({ text: '{"ok":true}' });
    const signal = new AbortController().signal;

    await expect(requestGeminiRepairText({
      provider: AIProvider.GEMINI,
      apiKey: ' mock-key\n',
      model: ' gemini-custom ',
    }, '{bad:}', signal)).resolves.toBe('{"ok":true}');

    expect(genaiMocks.GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'mock-key' });
    expect(genaiMocks.generateContent).toHaveBeenCalledWith({
      model: 'gemini-custom',
      contents: expect.stringContaining('{bad:}'),
      config: {
        abortSignal: signal,
      },
    });
  });

  it('Gemini 明确返回空对象时保留响应文本', async () => {
    genaiMocks.generateContent.mockResolvedValue({ text: '{}' });

    await expect(requestGeminiRepairText({
      provider: AIProvider.GEMINI,
      apiKey: 'mock-key',
      model: '',
    }, '{bad:}')).resolves.toBe('{}');
  });

  it('Gemini 响应被截断时拒绝使用部分文本', async () => {
    genaiMocks.generateContent.mockResolvedValue({
      text: '{"partial":',
      candidates: [{ finishReason: 'MAX_TOKENS' }],
    });

    await expect(requestGeminiRepairText({
      provider: AIProvider.GEMINI,
      apiKey: 'mock-key',
      model: '',
    }, '{bad:}')).rejects.toThrow(`${AI_INCOMPLETE_RESPONSE_MESSAGE}（finishReason: MAX_TOKENS）`);
  });

  it('Gemini 响应被安全策略拦截时返回明确错误', async () => {
    genaiMocks.generateContent.mockResolvedValue({
      candidates: [{ finishReason: 'SAFETY' }],
    });

    await expect(requestGeminiRepairText({
      provider: AIProvider.GEMINI,
      apiKey: 'mock-key',
      model: '',
    }, '{bad:}')).rejects.toThrow(`${AI_INCOMPLETE_RESPONSE_MESSAGE}（finishReason: SAFETY）`);
  });

  it('Gemini 空响应文本抛出空响应错误', async () => {
    genaiMocks.generateContent.mockResolvedValue({});

    await expect(requestGeminiRepairText({
      provider: AIProvider.GEMINI,
      apiKey: 'mock-key',
      model: '',
    }, '{bad:}')).rejects.toThrow(AI_EMPTY_RESPONSE_MESSAGE);
  });
});
