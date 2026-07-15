import type { FixJsonResult } from '../services/aiService';
import type { AiRepairSummary } from './aiRepairSummary';
import { AiRepairErrorCode, getAiRepairErrorCode } from './aiRepairErrors';
import { getErrorMessage } from './errors';

export interface AppAiRepairErrorFeedback {
  message: string;
  shouldOpenAiSettings: boolean;
}

interface BuildAppAiRepairResultInput {
  sourceText: string;
  repairResult: FixJsonResult;
  buildAiRepairSummary: (
    before: string,
    after: string,
    options: {
      repairMethod: FixJsonResult['repairMethod'];
      localRuleLabels: string[];
    },
  ) => AiRepairSummary;
}

export interface AppAiRepairApplyResult {
  fixedJson: string;
  summary: AiRepairSummary;
  successMessage: string;
}

export const getAppAiRepairSkipMessage = (sourceText: string): string | null => (
  sourceText.trim() ? null : '请先输入需要修复的 JSON 内容'
);

export const getAppAiRepairSuccessMessage = (repairMethod: FixJsonResult['repairMethod']): string => (
  repairMethod === 'local' ? '本地修复成功' : 'AI 修复成功'
);

export const getAppAiRepairErrorFeedback = (error: unknown): AppAiRepairErrorFeedback => {
  const rawMessage = getErrorMessage(error, 'AI 修复失败');
  const errorCode = getAiRepairErrorCode(error);
  const isApiKeyRequired = errorCode === AiRepairErrorCode.ApiKeyRequired
    || rawMessage.includes('API Key 未配置');
  const shouldOpenAiSettings = errorCode
    ? errorCode === AiRepairErrorCode.ApiKeyRequired || errorCode === AiRepairErrorCode.ProviderAuth
    : rawMessage.includes('API Key');

  return {
    message: isApiKeyRequired ? '请先配置 AI API Key' : rawMessage,
    shouldOpenAiSettings,
  };
};

export const buildAppAiRepairApplyResult = ({
  sourceText,
  repairResult,
  buildAiRepairSummary,
}: BuildAppAiRepairResultInput): AppAiRepairApplyResult => {
  const fixedJson = repairResult.fixedJson;
  return {
    fixedJson,
    summary: buildAiRepairSummary(sourceText, fixedJson, {
      repairMethod: repairResult.repairMethod,
      localRuleLabels: repairResult.localRuleLabels,
    }),
    successMessage: getAppAiRepairSuccessMessage(repairResult.repairMethod),
  };
};
