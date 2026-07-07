import { AIProvider, DEFAULT_GENERAL_SETTINGS } from '../types';
import type { AIConfig, GeneralSettings, TemplateFillConfig } from '../types';
import { getAIProviderDefaultModel } from './aiProviderDefaults';
import { isRecord, parseJsonWithFallback, safeGetStorageItem } from './storage';

export const GENERAL_SETTINGS_STORAGE_KEY = 'json-helper-general-settings';
export const AI_CONFIG_STORAGE_KEY = 'json-helper-ai-config';
export const TEMPLATE_FILL_STORAGE_KEY = 'json-helper-template-fill';

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: AIProvider.GEMINI,
  apiKey: '',
  model: getAIProviderDefaultModel(AIProvider.GEMINI),
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
      safeGetStorageItem(GENERAL_SETTINGS_STORAGE_KEY, storage),
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
  const fallbackModel = provider === fallback.provider && fallback.model.trim()
    ? fallback.model.trim()
    : getAIProviderDefaultModel(provider);

  return {
    provider,
    apiKey: typeof value.apiKey === 'string' ? value.apiKey.trim() : fallback.apiKey,
    model: typeof value.model === 'string' && value.model.trim()
      ? value.model.trim()
      : fallbackModel,
    baseUrl: typeof value.baseUrl === 'string' ? value.baseUrl.trim() : fallback.baseUrl,
  };
};

export const buildAIConfigForProviderChange = (
  config: AIConfig,
  provider: AIProvider
): AIConfig => {
  const normalizedConfig = normalizeAIConfig(config);
  if (provider === normalizedConfig.provider) return normalizedConfig;

  return {
    provider,
    apiKey: '',
    model: getAIProviderDefaultModel(provider),
    baseUrl: '',
  };
};

export const loadAIConfig = (storage: Storage = localStorage): AIConfig => {
  return normalizeAIConfig(
    parseJsonWithFallback<unknown>(
      safeGetStorageItem(AI_CONFIG_STORAGE_KEY, storage),
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
      safeGetStorageItem(TEMPLATE_FILL_STORAGE_KEY, storage),
      {}
    )
  );
};

export const sanitizeAIConfigForBackup = (config: AIConfig): AIConfig => ({
  ...normalizeAIConfig(config),
  apiKey: '',
});
