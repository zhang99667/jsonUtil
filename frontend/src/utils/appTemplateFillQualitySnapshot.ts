import { deepParseWithContext } from './transformations';

export type AppTemplateFillQualitySummaryModule = Pick<
  typeof import('./transformSummary'),
  | 'buildTransformContextReport'
  | 'buildTransformQualitySnapshot'
  | 'buildTransformReportView'
  | 'formatTransformQualitySnapshotDeltaText'
>;

interface AppTemplateFillQualitySnapshotInput {
  source: string;
  autoExpandScheme: boolean;
  summaryModule: AppTemplateFillQualitySummaryModule;
}

export const buildAppTemplateFillQualitySnapshot = ({
  source,
  autoExpandScheme,
  summaryModule,
}: AppTemplateFillQualitySnapshotInput) => {
  const { context } = deepParseWithContext(source, { autoExpandScheme });
  const report = summaryModule.buildTransformContextReport(context);
  return summaryModule.buildTransformQualitySnapshot(
    report,
    summaryModule.buildTransformReportView(report, ''),
    ''
  );
};
