import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

import type { AIConfig, GeneralSettings } from '../types';
import {
  AI_CONFIG_STORAGE_KEY,
  GENERAL_SETTINGS_STORAGE_KEY,
  loadAIConfig,
  loadGeneralSettings,
} from '../utils/appSettings';
import { safeSetStorageItem } from '../utils/storage';

interface UseAppSettingsStateResult {
  generalSettings: GeneralSettings;
  setGeneralSettings: Dispatch<SetStateAction<GeneralSettings>>;
  aiConfig: AIConfig;
  setAiConfig: Dispatch<SetStateAction<AIConfig>>;
}

export const useAppSettingsState = (): UseAppSettingsStateResult => {
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(loadGeneralSettings);
  const [aiConfig, setAiConfig] = useState<AIConfig>(loadAIConfig);

  useEffect(() => {
    safeSetStorageItem(GENERAL_SETTINGS_STORAGE_KEY, JSON.stringify(generalSettings));
  }, [generalSettings]);

  useEffect(() => {
    safeSetStorageItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(aiConfig));
  }, [aiConfig]);

  return {
    generalSettings,
    setGeneralSettings,
    aiConfig,
    setAiConfig,
  };
};
