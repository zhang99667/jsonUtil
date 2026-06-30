import type { ValidationResult } from '../types';
import { detectLanguage } from './transformations';

interface AppTemplateFillTargetErrorInput {
  isTemplatePanelOpen: boolean;
  sourceText: string;
  validation: ValidationResult;
}

export const getAppTemplateFillTargetError = ({
  isTemplatePanelOpen,
  sourceText,
  validation,
}: AppTemplateFillTargetErrorInput): string => {
  if (!isTemplatePanelOpen) return '';

  const trimmedSource = sourceText.trim();
  if (!trimmedSource) {
    return '请先在 SOURCE 输入合法 JSON';
  }

  if (detectLanguage(trimmedSource) !== 'json') {
    return '当前 SOURCE 不是合法 JSON，无法应用模板';
  }

  if (!validation.isValid) {
    return validation.error
      ? `当前 SOURCE JSON 无效: ${validation.error}`
      : '当前 SOURCE JSON 无效';
  }

  return '';
};
