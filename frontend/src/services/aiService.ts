import { AIConfig } from "../types";
import { formatUnknownError } from "../utils/errors";
import {
  AiRepairErrorCode,
  createAiRepairError,
  isAiRepairError,
} from "../utils/aiRepairErrors";
import {
  assertAiRepairInputCanUseExternalModel,
} from "../utils/aiRepairRequestPolicy";
import { assertAIProviderRequestConfig } from "../utils/aiProviderConfigValidation";
import {
  AI_REPAIR_TIMEOUT_MESSAGE,
  AI_REPAIR_TIMEOUT_MS,
  requestAiRepairProviderText,
} from "./aiRepairProviderClient";
import {
  normalizeAiJsonResponse,
} from "./aiRepairResponseNormalizer";
import {
  repairJsonLocallyWithReport,
} from "./aiLocalJsonRepair";
import {
  AI_CONNECTION_TEST_INPUT,
  AI_CONNECTION_TEST_INVALID_MESSAGE,
  assertAiConnectionTestResult,
} from "./aiRepairConnectionTest";

export {
  AI_INPUT_TOO_LARGE_MESSAGE,
  AI_REMOTE_REPAIR_MAX_INPUT_LENGTH,
  AI_SENSITIVE_INPUT_MESSAGE,
  buildAiRepairRequestPolicy,
  detectAiSensitiveInputLabels,
} from "../utils/aiRepairRequestPolicy";
export {
  repairJsonLocally,
  repairJsonLocallyWithReport,
  type LocalJsonRepairReport,
} from "./aiLocalJsonRepair";
export { normalizeAiJsonResponse } from "./aiRepairResponseNormalizer";
export {
  AI_REPAIR_TIMEOUT_MESSAGE,
  AI_REPAIR_TIMEOUT_MS,
} from "./aiRepairProviderClient";

export const AI_CONNECTION_TEST_TIMEOUT_MS = 10_000;
export const AI_CONNECTION_TEST_TIMEOUT_MESSAGE = 'AI 连接测试超时，请检查网络/模型配置';
export { AI_CONNECTION_TEST_INVALID_MESSAGE } from "./aiRepairConnectionTest";

interface FixJsonWithAIOptions {
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  allowLocalRepair?: boolean;
  signal?: AbortSignal;
}

export interface FixJsonResult {
  fixedJson: string;
  repairMethod: 'local' | 'ai';
  localRuleLabels: string[];
}

export const fixJsonWithAI = async (
  brokenJson: string,
  config: AIConfig,
  options: FixJsonWithAIOptions = {}
): Promise<string> => {
  const result = await fixJsonWithRepairDetails(brokenJson, config, options);
  return result.fixedJson;
};

export const fixJsonWithRepairDetails = async (
  brokenJson: string,
  config: AIConfig,
  options: FixJsonWithAIOptions = {}
): Promise<FixJsonResult> => {
  if (options.allowLocalRepair !== false) {
    const localReport = repairJsonLocallyWithReport(brokenJson);
    if (localReport) {
      return {
        fixedJson: localReport.fixedJson,
        repairMethod: 'local',
        localRuleLabels: localReport.ruleLabels,
      };
    }
  }

  assertAiRepairInputCanUseExternalModel(brokenJson);

  assertAIProviderRequestConfig(config);

  const text = await requestAiRepairProviderText(brokenJson, config, {
    timeoutMs: options.timeoutMs,
    fetchImpl: options.fetchImpl,
    signal: options.signal,
  });
  return {
    fixedJson: normalizeAiJsonResponse(text),
    repairMethod: 'ai',
    localRuleLabels: [],
  };
};

export const testAIConnection = async (
  config: AIConfig,
  options: FixJsonWithAIOptions = {}
): Promise<void> => {
  try {
    const fixedJson = await fixJsonWithAI(AI_CONNECTION_TEST_INPUT, config, {
      ...options,
      timeoutMs: options.timeoutMs ?? AI_CONNECTION_TEST_TIMEOUT_MS,
      allowLocalRepair: false,
    });
    assertAiConnectionTestResult(fixedJson);
  } catch (error: unknown) {
    const errorMessage = formatUnknownError(error);
    if (isAiRepairError(error) && error.code === AiRepairErrorCode.Timeout) {
      throw createAiRepairError(
        AiRepairErrorCode.ConnectionTestTimeout,
        AI_CONNECTION_TEST_TIMEOUT_MESSAGE
      );
    }
    throw error;
  }
};
