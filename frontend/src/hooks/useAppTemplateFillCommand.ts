import { useCallback, useMemo, type MutableRefObject } from 'react';
import type { ValidationResult } from '../types';
import { showError, showSuccess } from '../utils/toast';
import { getAppTemplateFillTargetError } from '../utils/appTemplateFillTargetError';
import { runAppTemplateFillCommand } from '../utils/appTemplateFillCommandRunner';

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

  const templateFillEffects = useMemo(() => ({
    getCurrentSourceText: () => inputRef.current,
    setCurrentSourceText: (value: string) => {
      inputRef.current = value;
    },
    loadSummaryModule: () => import('../utils/transformSummary'),
    onSetSourceText,
    onUpdateActiveFileContent,
    onSetTemplateApplyQualityDelta,
    onShowError: showError,
    onShowSuccess: showSuccess,
  }), [
    inputRef,
    onSetSourceText,
    onSetTemplateApplyQualityDelta,
    onUpdateActiveFileContent,
  ]);

  const handleApplyTemplate = useCallback((templateJson: string) => runAppTemplateFillCommand({
    autoExpandScheme,
    sourceBeforeApply: sourceText,
    templateJson,
  }, templateFillEffects), [
    sourceText,
    autoExpandScheme,
    templateFillEffects,
  ]);

  return { handleApplyTemplate, templateTargetError };
};
