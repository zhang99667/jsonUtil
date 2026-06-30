import { deepParseWithContext } from './transformations';

export type AppTemplateFillQualitySummaryModule = Pick<
  typeof import('./transformSummary'),
  | 'buildTransformContextReport'
  | 'buildTransformQualitySnapshot'
  | 'buildTransformReportView'
  | 'formatTransformQualitySnapshotDeltaText'
>;

interface AppTemplateFillQualityDeltaInput {
  sourceBeforeApply: string;
  sourceAfterApply: string;
  autoExpandScheme: boolean;
  summaryModule: AppTemplateFillQualitySummaryModule;
}

const buildAppTemplateFillQualitySnapshot = (
  source: string,
  autoExpandScheme: boolean,
  summaryModule: AppTemplateFillQualitySummaryModule
) => {
  const { context } = deepParseWithContext(source, { autoExpandScheme });
  const report = summaryModule.buildTransformContextReport(context);
  return summaryModule.buildTransformQualitySnapshot(
    report,
    summaryModule.buildTransformReportView(report, ''),
    ''
  );
};

export const buildAppTemplateFillQualityDelta = ({
  sourceBeforeApply,
  sourceAfterApply,
  autoExpandScheme,
  summaryModule,
}: AppTemplateFillQualityDeltaInput): string => {
  const beforeSnapshot = buildAppTemplateFillQualitySnapshot(
    sourceBeforeApply,
    autoExpandScheme,
    summaryModule
  );
  const afterSnapshot = buildAppTemplateFillQualitySnapshot(
    sourceAfterApply,
    autoExpandScheme,
    summaryModule
  );

  return summaryModule.formatTransformQualitySnapshotDeltaText(beforeSnapshot, afterSnapshot);
};
