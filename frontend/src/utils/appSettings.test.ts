import { describe, expect, it } from 'vitest';
import { AIProvider, DEFAULT_GENERAL_SETTINGS } from '../types';
import {
  AI_CONFIG_STORAGE_KEY,
  buildAIConfigForProviderChange,
  GENERAL_SETTINGS_STORAGE_KEY,
  loadAIConfig,
  loadGeneralSettings,
  normalizeAIConfig,
  normalizeGeneralSettings,
} from './appSettings';
import { MemoryStorage } from './memoryStorageTestHelper';

describe('app settings', () => {
  it('新用户默认开启深度格式化 CMD/Scheme 自动展开', () => {
    expect(DEFAULT_GENERAL_SETTINGS.autoExpandSchemeInDeepFormat).toBe(true);
    expect(normalizeGeneralSettings({}).autoExpandSchemeInDeepFormat).toBe(true);
    expect(loadGeneralSettings(new MemoryStorage()).autoExpandSchemeInDeepFormat).toBe(true);
  });

  it('保留用户显式关闭的深度格式化自动展开设置', () => {
    const storage = new MemoryStorage();
    storage.setItem(GENERAL_SETTINGS_STORAGE_KEY, JSON.stringify({
      autoExpandSchemeInDeepFormat: false,
    }));

    expect(normalizeGeneralSettings({
      autoExpandSchemeInDeepFormat: false,
    }).autoExpandSchemeInDeepFormat).toBe(false);
    expect(loadGeneralSettings(storage).autoExpandSchemeInDeepFormat).toBe(false);
  });

  it('加载 AI 配置时裁剪 API Key、模型名和 Base URL 空白', () => {
    const storage = new MemoryStorage();
    storage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify({
      provider: AIProvider.CUSTOM,
      apiKey: '  mock-key\n',
      model: '  custom-model  ',
      baseUrl: ' https://mock-ai.test/v1/ ',
    }));

    expect(loadAIConfig(storage)).toEqual({
      provider: AIProvider.CUSTOM,
      apiKey: 'mock-key',
      model: 'custom-model',
      baseUrl: 'https://mock-ai.test/v1/',
    });
  });

  it('AI 模型名为空白时回退默认模型', () => {
    expect(normalizeAIConfig({
      provider: AIProvider.GEMINI,
      apiKey: '  ',
      model: '   ',
      baseUrl: '   ',
    })).toEqual({
      provider: AIProvider.GEMINI,
      apiKey: '',
      model: 'gemini-2.0-flash',
      baseUrl: '',
    });
  });

  it('非 Gemini provider 模型名为空白时回退对应 provider 默认模型', () => {
    expect(normalizeAIConfig({
      provider: AIProvider.QWEN,
      apiKey: 'mock-key',
      model: '   ',
    }).model).toBe('qwen-max');
    expect(normalizeAIConfig({
      provider: AIProvider.DEEPSEEK,
      apiKey: 'mock-key',
      model: '',
    }).model).toBe('deepseek-chat');
  });

  it('provider 未变化时空模型名保留调用方传入的 fallback 模型', () => {
    expect(normalizeAIConfig({
      provider: AIProvider.OPENAI,
      model: ' ',
    }, {
      provider: AIProvider.OPENAI,
      apiKey: '',
      model: 'team-default-model',
    }).model).toBe('team-default-model');
  });

  it('切换 AI provider 时重置 provider 专属配置', () => {
    expect(buildAIConfigForProviderChange({
      provider: AIProvider.GEMINI,
      apiKey: 'gemini-key',
      model: 'gemini-2.0-flash',
      baseUrl: 'https://old-provider.test/v1',
    }, AIProvider.DEEPSEEK)).toEqual({
      provider: AIProvider.DEEPSEEK,
      apiKey: '',
      model: 'deepseek-chat',
      baseUrl: '',
    });
  });
});
