import { useCallback, useMemo, type MutableRefObject } from 'react';
import type { ValidationResult } from '../types';
import { showError, showSuccess } from '../utils/toast';
import { applyTemplate } from '../utils/transformations';
import { isPlaceholderFillTemplateJson } from '../utils/appWorkflowHelpers';
import { getAppTemplateFillTargetError } from '../utils/appTemplateFillTargetError';
import { buildAppTemplateFillQualityDelta } from '../utils/appTemplateFillQualityDelta';

interface UseAppTemplateFillCommandInput {
  sourceText: string;
  inputRef: MutableRefObject<string>;
  autoExpandScheme: boolean;
  validation: ValidationResult;
  isTemplatePanelOpen: boolean;
  onSetSourceText: (value: string) => void;
  onUpdateActiveFileContent: (value: string) => void;
  onSetTemplateApplyQualityDelta: (value: string) => void;
}

export const useAppTemplateFillCommand = ({
  sourceText,
  inputRef,
  autoExpandScheme,
  validation,
  isTemplatePanelOpen,
  onSetSourceText,
  onUpdateActiveFileContent,
  onSetTemplateApplyQualityDelta,
}: UseAppTemplateFillCommandInput) => {
  const templateTargetError = useMemo(() => getAppTemplateFillTargetError({
    isTemplatePanelOpen,
    sourceText,
    validation,
  }), [isTemplatePanelOpen, sourceText, validation]);

  const handleApplyTemplate = useCallback(async (templateJson: string) => {
    try {
      const sourceBeforeApply = sourceText;
      const shouldBuildQualityDelta = isPlaceholderFillTemplateJson(templateJson);
      const summaryModule = shouldBuildQualityDelta
        ? await import('../utils/transformSummary')
        : null;
      if (summaryModule && inputRef.current !== sourceBeforeApply) {
        onSetTemplateApplyQualityDelta('');
        showError('内容已变化，请重新应用模板');
        return;
      }
      const merged = applyTemplate(sourceBeforeApply, templateJson);
      if (summaryModule) {
        onSetTemplateApplyQualityDelta(buildAppTemplateFillQualityDelta({
          sourceBeforeApply,
          sourceAfterApply: merged,
          autoExpandScheme,
          summaryModule,
        }));
      } else {
        onSetTemplateApplyQualityDelta('');
      }
      onSetSourceText(merged);
      inputRef.current = merged;
      onUpdateActiveFileContent(merged);
      showSuccess(summaryModule ? '占位符已回填，质量对比已更新' : '模板已应用');
    } catch (error: unknown) {
      onSetTemplateApplyQualityDelta('');
      const message = error instanceof Error ? error.message : '模板应用失败';
      showError(message);
    }
  }, [
    autoExpandScheme,
    inputRef,
    onSetSourceText,
    onSetTemplateApplyQualityDelta,
    onUpdateActiveFileContent,
    sourceText,
  ]);

  return {
    handleApplyTemplate,
    templateTargetError,
  };
};
