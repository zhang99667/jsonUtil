import type { AppTemplateFillQualitySummaryModule } from './appTemplateFillQualitySnapshot';

export interface AppTemplateFillCommandInput {
  sourceBeforeApply: string;
  templateJson: string;
  autoExpandScheme: boolean;
}

export interface AppTemplateFillCommandEffects {
  getCurrentSourceText: () => string;
  setCurrentSourceText: (value: string) => void;
  loadSummaryModule: () => Promise<AppTemplateFillQualitySummaryModule>;
  onSetSourceText: (value: string) => void;
  onUpdateActiveFileContent: (value: string) => void;
  onSetTemplateApplyQualityDelta: (value: string) => void;
  onShowError: (message: string) => void;
  onShowSuccess: (message: string) => void;
}
