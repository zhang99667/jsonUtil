import { getAppTemplateFillSuccessMessage } from './appTemplateFillCommandMessages';

interface AppTemplateFillCommandResultEffects {
  setCurrentSourceText: (value: string) => void;
  onSetSourceText: (value: string) => void;
  onUpdateActiveFileContent: (value: string) => void;
  onSetTemplateApplyQualityDelta: (value: string) => void;
  onShowSuccess: (message: string) => void;
}

interface AppTemplateFillCommandResultInput {
  effects: AppTemplateFillCommandResultEffects;
  merged: string;
  shouldLoadSummary: boolean;
  qualityDelta: string;
}

export const commitAppTemplateFillCommandResult = ({
  effects,
  merged,
  shouldLoadSummary,
  qualityDelta,
}: AppTemplateFillCommandResultInput) => {
  effects.onSetTemplateApplyQualityDelta(qualityDelta);
  effects.onSetSourceText(merged);
  effects.setCurrentSourceText(merged);
  effects.onUpdateActiveFileContent(merged);
  effects.onShowSuccess(getAppTemplateFillSuccessMessage(shouldLoadSummary, qualityDelta));
};
