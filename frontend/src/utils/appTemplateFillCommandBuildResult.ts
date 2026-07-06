import {
  type AppTemplateFillQualitySummaryModule,
  tryBuildAppTemplateFillQualityDelta,
} from './appTemplateFillQualityDelta';
import { applyTemplate } from './transformations';

interface AppTemplateFillCommandBuildResultInput {
  sourceBeforeApply: string;
  templateJson: string;
  autoExpandScheme: boolean;
  summaryModule: AppTemplateFillQualitySummaryModule | null;
}

interface AppTemplateFillCommandBuildResult {
  merged: string;
  qualityDelta: string;
}

export const buildAppTemplateFillCommandResult = ({
  sourceBeforeApply,
  templateJson,
  autoExpandScheme,
  summaryModule,
}: AppTemplateFillCommandBuildResultInput): AppTemplateFillCommandBuildResult => {
  const merged = applyTemplate(sourceBeforeApply, templateJson);
  const qualityDelta = summaryModule
    ? tryBuildAppTemplateFillQualityDelta({
      sourceBeforeApply,
      sourceAfterApply: merged,
      autoExpandScheme,
      summaryModule,
    })
    : '';

  return { merged, qualityDelta };
};
