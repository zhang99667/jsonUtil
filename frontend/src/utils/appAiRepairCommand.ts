import type { FixJsonResult } from '../services/aiService';
import type { AiRepairSummary } from './aiRepairSummary';

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
  const rawMessage = error instanceof Error ? error.message : 'AI 修复失败';
  return {
    message: rawMessage.includes('API Key 未配置') ? '请先配置 AI API Key' : rawMessage,
    shouldOpenAiSettings: rawMessage.includes('API Key'),
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
