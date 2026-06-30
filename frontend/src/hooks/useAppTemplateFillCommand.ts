import { useCallback, useMemo, type MutableRefObject } from 'react';
import type { ValidationResult } from '../types';
import { showError, showSuccess } from '../utils/toast';
import {
  applyTemplate,
  deepParseWithContext,
  detectLanguage,
} from '../utils/transformations';
import { isPlaceholderFillTemplateJson } from '../utils/appWorkflowHelpers';

type TransformSummaryModule = typeof import('../utils/transformSummary');

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

const buildCurrentQualitySnapshot = (
  source: string,
  autoExpandScheme: boolean,
  summaryModule: TransformSummaryModule
) => {
  const {
    buildTransformContextReport,
    buildTransformQualitySnapshot,
    buildTransformReportView,
  } = summaryModule;
  const { context } = deepParseWithContext(source, { autoExpandScheme });
  const report = buildTransformContextReport(context);
  return buildTransformQualitySnapshot(report, buildTransformReportView(report, ''), '');
};

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
  const templateTargetError = useMemo(() => {
    if (!isTemplatePanelOpen) return '';

    const trimmedInput = sourceText.trim();
    if (!trimmedInput) {
      return '请先在 SOURCE 输入合法 JSON';
    }

    if (detectLanguage(trimmedInput) !== 'json') {
      return '当前 SOURCE 不是合法 JSON，无法应用模板';
    }

    if (!validation.isValid) {
      return validation.error
        ? `当前 SOURCE JSON 无效: ${validation.error}`
        : '当前 SOURCE JSON 无效';
    }

    return '';
  }, [isTemplatePanelOpen, sourceText, validation]);

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
      const beforeSnapshot = summaryModule
        ? buildCurrentQualitySnapshot(sourceBeforeApply, autoExpandScheme, summaryModule)
        : null;
      const merged = applyTemplate(sourceBeforeApply, templateJson);
      if (beforeSnapshot && summaryModule) {
        const afterSnapshot = buildCurrentQualitySnapshot(merged, autoExpandScheme, summaryModule);
        onSetTemplateApplyQualityDelta(summaryModule.formatTransformQualitySnapshotDeltaText(beforeSnapshot, afterSnapshot));
      } else {
        onSetTemplateApplyQualityDelta('');
      }
      onSetSourceText(merged);
      inputRef.current = merged;
      onUpdateActiveFileContent(merged);
      showSuccess(beforeSnapshot ? '占位符已回填，质量对比已更新' : '模板已应用');
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
