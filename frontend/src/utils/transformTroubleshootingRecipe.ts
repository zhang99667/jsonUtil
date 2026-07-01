import { APP_VERSION_METADATA } from './appVersion';
import {
  buildArchiveSuggestedCommands,
  buildCmdComparisonSuggestedCommands,
  buildIssueSampleSuggestedCommands,
  uniqueSuggestedCommands,
} from './transformSuggestedCommands';
import {
  buildTransformTroubleshootingRecipeSteps,
  formatTroubleshootingRecipeFilter,
} from './transformTroubleshootingRecipeSteps';
import type { TransformTroubleshootingRecipe } from './transformTroubleshootingRecipeTypes';
import type {
  TransformContextReport,
  TransformReportView,
} from './transformSummary';

export type {
  TransformTroubleshootingRecipe,
  TransformTroubleshootingRecipeStep,
} from './transformTroubleshootingRecipeTypes';

export const buildTransformTroubleshootingRecipe = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string
): TransformTroubleshootingRecipe => {
  const filter = formatTroubleshootingRecipeFilter(query);
  const steps = buildTransformTroubleshootingRecipeSteps(reportView, filter);

  return {
    schemaVersion: 1,
    kind: 'json-helper-transform-troubleshooting-recipe',
    tool: APP_VERSION_METADATA,
    filter,
    safety: {
      containsRawResponse: false,
      containsOriginalValues: false,
      notes: [
        'recipe 只描述排查步骤和可导出的安全材料，不携带 SOURCE 原文或字段原始值。',
        '运行 recipe 时请从已脱敏 response 或当前 SOURCE 重新生成报告。',
        'cmdHandler expected、问题样本和 corpus 文件在提交前仍需按业务规则脱敏。',
      ],
    },
    summary: {
      coverageLabel: report.coverage.label,
      coverageScore: report.coverage.score,
      records: reportView.filteredRecordCount,
      cmdStructures: reportView.filteredCmdStructureCount,
      nestedCommandFields: reportView.filteredNestedCommandFieldCount,
      nestedResourceFields: reportView.filteredNestedResourceFieldCount,
      runtimePlaceholders: reportView.filteredPlaceholderCount,
      unresolved: reportView.filteredUnresolvedCount,
      warnings: reportView.filteredWarningCount,
      truncated: reportView.isRecordTruncated ||
        reportView.isCmdStructureTruncated ||
        reportView.isPlaceholderTruncated ||
        reportView.isUnresolvedTruncated ||
        reportView.isWarningTruncated,
    },
    steps,
    suggestedCommands: uniqueSuggestedCommands([
      ...(reportView.filteredCmdStructureCount > 0 ? buildCmdComparisonSuggestedCommands() : []),
      ...(reportView.filteredUnresolvedCount > 0 || reportView.filteredWarningCount > 0
        ? buildIssueSampleSuggestedCommands()
        : []),
      ...buildArchiveSuggestedCommands(),
    ]),
  };
};

export const formatTransformTroubleshootingRecipeJsonText = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string
): string => JSON.stringify(buildTransformTroubleshootingRecipe(report, reportView, query), null, 2);
