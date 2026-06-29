import type { AppVersionMetadata } from './appVersion';
import {
  formatCmdStructureDiff,
  type CmdStructureDiff,
} from './cmdStructureDiff';
import { formatCmdPathCountSummary } from './transformReportCmdComparisonHelpers';
import type { CmdComparisonDiffSummary } from './transformReportCmdComparisonTypes';

interface CmdComparisonDiffReportInput {
  path: string;
  sourceLabel?: string;
  ignoreExtraPaths: boolean;
  tool: AppVersionMetadata;
}

export const formatCmdComparisonDiffReport = (
  diff: CmdStructureDiff,
  input: CmdComparisonDiffReportInput
): string => formatCmdStructureDiff(diff, {
  path: input.path,
  sourceLabel: input.sourceLabel,
  tool: input.tool,
  modeLabel: input.ignoreExtraPaths ? '忽略 actual 额外路径' : undefined,
});

export const buildCmdComparisonDiffSummary = (
  diffReportText: string,
  diff: CmdStructureDiff
): CmdComparisonDiffSummary => ({
  hasDifferences: diff.hasDifferences,
  missingLabel: formatCmdPathCountSummary('缺失', diff.missingPaths),
  extraLabel: formatCmdPathCountSummary('额外', diff.extraPaths),
  ignoredExtraLabel: diff.ignoredExtraPaths.length
    ? formatCmdPathCountSummary('已忽略', diff.ignoredExtraPaths)
    : '',
  valueDiffCount: diff.valueDiffs.length,
  hasSchemaDiff: Boolean(diff.schemaDiff),
  hasSourceDiff: Boolean(diff.sourceDiff),
  previewLines: diffReportText.split('\n').slice(1, 6),
});
