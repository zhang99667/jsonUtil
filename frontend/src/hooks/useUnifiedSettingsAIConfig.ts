import { useCallback, useEffect, useRef, useState } from 'react';
import { AIProvider, type AIConfig } from '../types';
import { buildAIConfigForProviderChange } from '../utils/appSettings';
import { dispatchChunkLoadRecoveryEvent } from '../utils/chunkLoadRecoveryDispatch';
import { getErrorMessage } from '../utils/errors';
import {
  getAIProviderConfigValidationError,
  getAIProviderRequestValidationError,
} from '../utils/aiProviderConfigValidation';

export interface AIConnectionTestResult {
  type: 'success' | 'error';
  message: string;
}

interface UseUnifiedSettingsAIConfigOptions {
  isOpen: boolean;
  initialConfig: AIConfig;
  onSave: (config: AIConfig) => void;
  onClose: () => void;
}

export const useUnifiedSettingsAIConfig = ({
  isOpen,
  initialConfig,
  onSave,
  onClose,
}: UseUnifiedSettingsAIConfigOptions) => {
  const [config, setConfig] = useState<AIConfig>(initialConfig);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<AIConnectionTestResult | null>(null);
  const configVersionRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelConnectionTest = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsTesting(false);
  }, []);

  const invalidateConnectionTest = useCallback(() => {
    configVersionRef.current++;
    cancelConnectionTest();
    setTestResult(null);
  }, [cancelConnectionTest]);

  useEffect(() => {
    configVersionRef.current++;
    cancelConnectionTest();
    if (!isOpen) return;

    setConfig(initialConfig);
    setTestResult(null);
  }, [isOpen, initialConfig, cancelConnectionTest]);

  useEffect(() => () => {
    configVersionRef.current++;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  const updateConfig = useCallback((patch: Partial<AIConfig>) => {
    invalidateConnectionTest();
    setConfig(currentConfig => ({ ...currentConfig, ...patch }));
  }, [invalidateConnectionTest]);

  const changeProvider = useCallback((provider: AIProvider) => {
    invalidateConnectionTest();
    setConfig(currentConfig => buildAIConfigForProviderChange(currentConfig, provider));
  }, [invalidateConnectionTest]);

  const saveConfig = useCallback(() => {
    const validationError = getAIProviderConfigValidationError(config);
    if (validationError) {
      setTestResult({ type: 'error', message: validationError });
      return;
    }

    onSave(config);
    onClose();
  }, [config, onClose, onSave]);

  const testConnection = useCallback(async () => {
    const validationError = getAIProviderRequestValidationError(config);
    if (validationError) {
      setTestResult({ type: 'error', message: validationError });
      return;
    }

    cancelConnectionTest();
    configVersionRef.current++;
    const testVersion = configVersionRef.current;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsTesting(true);
    setTestResult(null);

    try {
      const { testAIConnection } = await import('../services/aiService');
      await testAIConnection(config, { signal: abortController.signal });
      if (testVersion === configVersionRef.current) {
        setTestResult({ type: 'success', message: '连接测试通过' });
      }
    } catch (error: unknown) {
      if (dispatchChunkLoadRecoveryEvent(error)) return;

      const message = getErrorMessage(error, '连接测试失败');
      if (testVersion === configVersionRef.current) {
        setTestResult({ type: 'error', message });
      }
    } finally {
      if (testVersion === configVersionRef.current) {
        abortControllerRef.current = null;
        setIsTesting(false);
      }
    }
  }, [cancelConnectionTest, config]);

  return {
    config,
    isTesting,
    testResult,
    updateConfig,
    changeProvider,
    saveConfig,
    testConnection,
  };
};
