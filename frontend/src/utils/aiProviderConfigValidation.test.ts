import { describe, expect, it } from 'vitest';
import { AIProvider, type AIConfig } from '../types';
import {
  AI_API_KEY_REQUIRED_MESSAGE,
  AI_BASE_URL_INVALID_MESSAGE,
  AI_CUSTOM_BASE_URL_REQUIRED_MESSAGE,
  assertAIProviderRequestConfig,
  getAIProviderConfigValidationError,
  getAIProviderRequestValidationError,
  isValidOpenAICompatibleBaseUrl,
} from './aiProviderConfigValidation';
import { AiRepairErrorCode, getAiRepairErrorCode } from './aiRepairErrors';

const buildConfig = (patch: Partial<AIConfig> = {}): AIConfig => ({
  provider: AIProvider.CUSTOM,
  apiKey: 'mock-key',
  model: 'mock-model',
  baseUrl: 'https://mock-ai.test/v1',
  ...patch,
});

describe('ai provider config validation', () => {
  it('保存配置时只校验 provider 形态，允许暂时清空 API Key', () => {
    expect(getAIProviderConfigValidationError(buildConfig({ apiKey: '' }))).toBe('');
    expect(getAIProviderConfigValidationError(buildConfig({ baseUrl: '  ' })))
      .toBe(AI_CUSTOM_BASE_URL_REQUIRED_MESSAGE);
  });

  it('保存配置时拒绝非 http(s) Base URL', () => {
    expect(getAIProviderConfigValidationError(buildConfig({ baseUrl: 'mock-ai.test/v1' })))
      .toBe(AI_BASE_URL_INVALID_MESSAGE);
    expect(getAIProviderConfigValidationError(buildConfig({
      provider: AIProvider.OPENAI,
      baseUrl: 'ftp://mock-ai.test/v1',
    }))).toBe(AI_BASE_URL_INVALID_MESSAGE);
    expect(getAIProviderConfigValidationError(buildConfig({
      provider: AIProvider.OPENAI,
      baseUrl: '',
    }))).toBe('');
  });

  it('请求 AI 前同时校验 API Key 和 custom Base URL', () => {
    expect(getAIProviderRequestValidationError(buildConfig({ apiKey: '  ' })))
      .toBe(AI_API_KEY_REQUIRED_MESSAGE);
    expect(getAIProviderRequestValidationError(buildConfig({ baseUrl: '' })))
      .toBe(AI_CUSTOM_BASE_URL_REQUIRED_MESSAGE);
    expect(getAIProviderRequestValidationError(buildConfig({ baseUrl: 'mock-ai.test/v1' })))
      .toBe(AI_BASE_URL_INVALID_MESSAGE);
  });

  it('请求配置无效时抛出可读错误', () => {
    expect(() => assertAIProviderRequestConfig(buildConfig({ baseUrl: '' })))
      .toThrow(AI_CUSTOM_BASE_URL_REQUIRED_MESSAGE);
  });

  it('请求配置无效时携带结构化错误码', () => {
    let error: unknown;
    try {
      assertAIProviderRequestConfig(buildConfig({ apiKey: '  ' }));
    } catch (caughtError) {
      error = caughtError;
    }

    expect(getAiRepairErrorCode(error)).toBe(AiRepairErrorCode.ApiKeyRequired);
  });

  it('Base URL 格式无效时携带结构化错误码', () => {
    let error: unknown;
    try {
      assertAIProviderRequestConfig(buildConfig({ baseUrl: 'mock-ai.test/v1' }));
    } catch (caughtError) {
      error = caughtError;
    }

    expect(getAiRepairErrorCode(error)).toBe(AiRepairErrorCode.BaseUrlInvalid);
  });

  it('识别合法的 OpenAI-compatible Base URL', () => {
    expect(isValidOpenAICompatibleBaseUrl('https://mock-ai.test/v1')).toBe(true);
    expect(isValidOpenAICompatibleBaseUrl('http://localhost:11434/v1')).toBe(true);
    expect(isValidOpenAICompatibleBaseUrl('mock-ai.test/v1')).toBe(false);
    expect(isValidOpenAICompatibleBaseUrl('javascript:alert(1)')).toBe(false);
  });
});
