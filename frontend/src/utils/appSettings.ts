import { AIProvider, DEFAULT_GENERAL_SETTINGS } from '../types';
import type { AIConfig, GeneralSettings, TemplateFillConfig } from '../types';
import { isRecord, parseJsonWithFallback } from './storage';

export const GENERAL_SETTINGS_STORAGE_KEY = 'json-helper-general-settings';
export const AI_CONFIG_STORAGE_KEY = 'json-helper-ai-config';
export const TEMPLATE_FILL_STORAGE_KEY = 'json-helper-template-fill';

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: AIProvider.GEMINI,
  apiKey: '',
  model: 'gemini-2.0-flash',
};

export const normalizeGeneralSettings = (value: unknown): GeneralSettings => {
  if (!isRecord(value)) {
    return DEFAULT_GENERAL_SETTINGS;
  }

  return {
    ...DEFAULT_GENERAL_SETTINGS,
    autoExpandSchemeInDeepFormat:
      typeof value.autoExpandSchemeInDeepFormat === 'boolean'
        ? value.autoExpandSchemeInDeepFormat
        : DEFAULT_GENERAL_SETTINGS.autoExpandSchemeInDeepFormat,
  };
};

export const loadGeneralSettings = (storage: Storage = localStorage): GeneralSettings => {
  return normalizeGeneralSettings(
    parseJsonWithFallback<unknown>(
      storage.getItem(GENERAL_SETTINGS_STORAGE_KEY),
      {}
    )
  );
};

export const normalizeAIConfig = (
  value: unknown,
  fallback: AIConfig = DEFAULT_AI_CONFIG
): AIConfig => {
  if (!isRecord(value)) {
    return fallback;
  }

  const provider = Object.values(AIProvider).includes(value.provider as AIProvider)
    ? value.provider as AIProvider
    : fallback.provider;

  return {
    provider,
    apiKey: typeof value.apiKey === 'string' ? value.apiKey : fallback.apiKey,
    model: typeof value.model === 'string' && value.model.trim()
      ? value.model
      : fallback.model,
    baseUrl: typeof value.baseUrl === 'string' ? value.baseUrl : fallback.baseUrl,
  };
};

export const loadAIConfig = (storage: Storage = localStorage): AIConfig => {
  return normalizeAIConfig(
    parseJsonWithFallback<unknown>(
      storage.getItem(AI_CONFIG_STORAGE_KEY),
      {}
    )
  );
};

export const normalizeTemplateFillConfig = (value: unknown): TemplateFillConfig => {
  if (!isRecord(value)) {
    return { template: '', lastUpdated: 0 };
  }

  return {
    template: typeof value.template === 'string' ? value.template : '',
    lastUpdated: typeof value.lastUpdated === 'number' && Number.isFinite(value.lastUpdated)
      ? value.lastUpdated
      : 0,
  };
};

export const loadTemplateFillConfig = (storage: Storage = localStorage): TemplateFillConfig => {
  return normalizeTemplateFillConfig(
    parseJsonWithFallback<unknown>(
      storage.getItem(TEMPLATE_FILL_STORAGE_KEY),
      {}
    )
  );
};

export const sanitizeAIConfigForBackup = (config: AIConfig): AIConfig => ({
  ...normalizeAIConfig(config),
  apiKey: '',
});
