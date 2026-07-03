import type { AppTemplateFillCommandEffects } from './appTemplateFillCommandRunner';
import { showError, showSuccess } from './toast';

interface SourceTextRef {
  current: string;
}

export interface AppTemplateFillCommandEffectsInput {
  inputRef: SourceTextRef;
  onSetSourceText: (value: string) => void;
  onUpdateActiveFileContent: (value: string) => void;
  onSetTemplateApplyQualityDelta: (value: string) => void;
}

export const createAppTemplateFillCommandEffects = ({
  inputRef,
  onSetSourceText,
  onUpdateActiveFileContent,
  onSetTemplateApplyQualityDelta,
}: AppTemplateFillCommandEffectsInput): AppTemplateFillCommandEffects => ({
  getCurrentSourceText: () => inputRef.current,
  setCurrentSourceText: (value: string) => {
    inputRef.current = value;
  },
  loadSummaryModule: () => import('./transformSummary'),
  onSetSourceText,
  onUpdateActiveFileContent,
  onSetTemplateApplyQualityDelta,
  onShowError: showError,
  onShowSuccess: showSuccess,
});
