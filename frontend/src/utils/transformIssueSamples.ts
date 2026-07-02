import { APP_VERSION_METADATA } from './appVersion';
import { redactSensitiveIssueSamples } from './issueSampleRedaction';
import {
  buildTransformIssueSampleSummary,
  collectRuntimePlaceholderIssueSamples,
  collectTransformIssueSamples,
} from './transformIssueSampleCollectors';
import { formatIssueSampleFilter } from './transformIssueSampleReportText';
import { buildIssueSampleSuggestedCommands } from './transformSuggestedCommands';
import type {
  TransformIssueSampleExport,
  TransformIssueSampleJsonOptions,
  TransformReportView,
} from './transformSummary';

export { formatTransformIssueSampleReportText } from './transformIssueSampleReportText';

export const buildTransformIssueSampleExport = (
  reportView: TransformReportView,
  options: TransformIssueSampleJsonOptions = {}
): TransformIssueSampleExport | null => {
  const placeholderSamples = collectRuntimePlaceholderIssueSamples(reportView);
  const samples = collectTransformIssueSamples(reportView, placeholderSamples);

  if (samples.length === 0) {
    return null;
  }

  const outputSamples = options.redactSensitiveValues
    ? redactSensitiveIssueSamples(samples)
    : samples;

  return {
    schemaVersion: 1,
    kind: 'json-helper-transform-issue-samples',
    tool: APP_VERSION_METADATA,
    filter: formatIssueSampleFilter(options.filter),
    suggestedCommands: buildIssueSampleSuggestedCommands(),
    summary: buildTransformIssueSampleSummary(reportView, placeholderSamples.length),
    samples: outputSamples,
  };
};

export const formatTransformIssueSampleJsonText = (
  reportView: TransformReportView,
  options: TransformIssueSampleJsonOptions = {}
): string => {
  const sampleExport = buildTransformIssueSampleExport(reportView, options);
  return sampleExport ? JSON.stringify(sampleExport, null, 2) : '';
};
