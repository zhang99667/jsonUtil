import { describe, expect, it } from 'vitest';
import { AIProvider } from '../types';
import {
  getAIProviderBaseUrlPlaceholder,
  getAIProviderDefaultModel,
  getOpenAICompatibleDefaultBaseUrl,
} from './aiProviderDefaults';

describe('ai provider defaults', () => {
  it('按 provider 返回默认模型', () => {
    expect(getAIProviderDefaultModel(AIProvider.GEMINI)).toBe('gemini-2.0-flash');
    expect(getAIProviderDefaultModel(AIProvider.QWEN)).toBe('qwen-max');
    expect(getAIProviderDefaultModel(AIProvider.DEEPSEEK)).toBe('deepseek-chat');
    expect(getAIProviderDefaultModel(AIProvider.CUSTOM)).toBe('gpt-4o-mini');
  });

  it('按 provider 返回 OpenAI-compatible Base URL 默认值和自定义占位符', () => {
    expect(getOpenAICompatibleDefaultBaseUrl(AIProvider.QWEN))
      .toBe('https://dashscope.aliyuncs.com/compatible-mode/v1');
    expect(getOpenAICompatibleDefaultBaseUrl(AIProvider.CUSTOM)).toBe('https://api.openai.com/v1');
    expect(getAIProviderBaseUrlPlaceholder(AIProvider.CUSTOM)).toBe('https://your-api-endpoint.com/v1');
  });
});
