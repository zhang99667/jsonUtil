import { useCallback, useMemo } from 'react';
import type { ValidationResult } from '../types';
import {
  createAppTemplateFillCommandEffects,
  type AppTemplateFillCommandEffectsInput,
} from '../utils/appTemplateFillCommandEffects';
import { getAppTemplateFillTargetError } from '../utils/appTemplateFillTargetError';
import { runAppTemplateFillCommand } from '../utils/appTemplateFillCommandRunner';

interface UseAppTemplateFillCommandInput extends AppTemplateFillCommandEffectsInput {
  sourceText: string;
  autoExpandScheme: boolean;
  validation: ValidationResult;
  isTemplatePanelOpen: boolean;
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

  const handleApplyTemplate = useCallback((templateJson: string) => runAppTemplateFillCommand({
    autoExpandScheme,
    sourceBeforeApply: sourceText,
    templateJson,
  }, createAppTemplateFillCommandEffects({
    inputRef,
    onSetSourceText,
    onUpdateActiveFileContent,
    onSetTemplateApplyQualityDelta,
  })), [
    autoExpandScheme,
    inputRef,
    onSetSourceText,
    onSetTemplateApplyQualityDelta,
    onUpdateActiveFileContent,
    sourceText,
  ]);

  return { handleApplyTemplate, templateTargetError };
};
