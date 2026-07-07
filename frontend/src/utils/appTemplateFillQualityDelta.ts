import {
  buildAppTemplateFillQualitySnapshot,
  type AppTemplateFillQualitySummaryModule,
} from './appTemplateFillQualitySnapshot';

export type { AppTemplateFillQualitySummaryModule } from './appTemplateFillQualitySnapshot';

interface AppTemplateFillQualityDeltaInput {
  sourceBeforeApply: string;
  sourceAfterApply: string;
  autoExpandScheme: boolean;
  summaryModule: AppTemplateFillQualitySummaryModule;
}

export const buildAppTemplateFillQualityDelta = ({
  sourceBeforeApply,
  sourceAfterApply,
  autoExpandScheme,
  summaryModule,
}: AppTemplateFillQualityDeltaInput): string => {
  const buildSnapshot = (source: string) => buildAppTemplateFillQualitySnapshot({
    source,
    autoExpandScheme,
    summaryModule,
  });

  return summaryModule.formatTransformQualitySnapshotDeltaText(
    buildSnapshot(sourceBeforeApply),
    buildSnapshot(sourceAfterApply)
  );
};

export const tryBuildAppTemplateFillQualityDelta = (input: AppTemplateFillQualityDeltaInput): string => {
  try {
    return buildAppTemplateFillQualityDelta(input);
  } catch {
    return '';
  }
};
