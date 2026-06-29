import { APP_VERSION_METADATA, type AppVersionMetadata } from './appVersion';
import {
  buildArchiveSuggestedCommands,
  buildCmdComparisonSuggestedCommands,
  buildIssueSampleSuggestedCommands,
  uniqueSuggestedCommands,
  type TransformSuggestedCommand,
} from './transformSuggestedCommands';
import type {
  TransformContextReport,
  TransformReportView,
} from './transformSummary';

export interface TransformTroubleshootingRecipeStep {
  id: string;
  label: string;
  action: string;
  description: string;
  input: string;
  output: string;
  dependsOn: string[];
  enabled: boolean;
}

export interface TransformTroubleshootingRecipe {
  schemaVersion: 1;
  kind: 'json-helper-transform-troubleshooting-recipe';
  tool: AppVersionMetadata;
  filter: string;
  safety: {
    containsRawResponse: false;
    containsOriginalValues: false;
    notes: string[];
  };
  summary: {
    coverageLabel: string;
    coverageScore: number;
    records: number;
    cmdStructures: number;
    nestedCommandFields: number;
    nestedResourceFields: number;
    runtimePlaceholders: number;
    unresolved: number;
    warnings: number;
    truncated: boolean;
  };
  steps: TransformTroubleshootingRecipeStep[];
  suggestedCommands: TransformSuggestedCommand[];
}

const formatTroubleshootingRecipeFilter = (filter?: string): string => filter?.trim() || '全部';

const createRecipeStep = (
  step: TransformTroubleshootingRecipeStep
): TransformTroubleshootingRecipeStep => step;

export const buildTransformTroubleshootingRecipe = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string
): TransformTroubleshootingRecipe => {
  const filter = formatTroubleshootingRecipeFilter(query);
  const reportDependency = filter === '全部' ? 'deep-format-report' : 'apply-report-filter';
  const steps: TransformTroubleshootingRecipeStep[] = [
    createRecipeStep({
      id: 'deep-format-report',
      label: '生成深度解析报告',
      action: 'open-transform-report',
      description: '从 SOURCE 执行嵌套解析，生成展开记录、CMD 结构、资源字段、占位符、待检查和跳过记录。',
      input: 'SOURCE 当前 JSON / JSON Lines / response 文本',
      output: 'TransformContextReport',
      dependsOn: [],
      enabled: true,
    }),
  ];

  if (filter !== '全部') {
    steps.push(createRecipeStep({
      id: 'apply-report-filter',
      label: `筛选 ${filter}`,
      action: 'set-transform-report-filter',
      description: '复用当前报告筛选词，只查看命中的记录、待检查、占位符和跳过项。',
      input: 'TransformContextReport',
      output: 'TransformReportView',
      dependsOn: ['deep-format-report'],
      enabled: true,
    }));
  }

  if (reportView.filteredCmdStructureCount > 0) {
    steps.push(createRecipeStep({
      id: 'compare-cmd-handler',
      label: '对比 cmdHandler',
      action: 'copy-cmd-structure-and-diff',
      description: '复制当前筛选下的 CMD 结构，粘贴 cmdHandler 输出后对比 cmdSchema、source 和 cmdParams 路径差异。',
      input: 'TransformReportView.cmdStructureRecords + cmdHandler expected',
      output: 'CMD 结构差异报告',
      dependsOn: [reportDependency],
      enabled: true,
    }));
  }

  if (reportView.filteredPlaceholderCount > 0) {
    steps.push(createRecipeStep({
      id: 'fill-runtime-placeholders',
      label: '回填运行时占位符',
      action: 'copy-placeholder-fill-template',
      description: '导出占位符回填模板，补齐服务端或客户端运行时值后重新深度解析，并用质量快照对比变化。',
      input: 'TransformReportView.runtimePlaceholderGroups',
      output: 'json-helper-runtime-placeholder-fill-template',
      dependsOn: [reportDependency],
      enabled: true,
    }));
  }

  if (reportView.filteredUnresolvedCount > 0 || reportView.filteredWarningCount > 0) {
    steps.push(createRecipeStep({
      id: 'promote-issue-samples',
      label: '沉淀问题样本',
      action: 'copy-redacted-issue-samples-and-regression-template',
      description: '复制脱敏问题样本和 Vitest TODO 模板，把待检查或跳过记录沉淀成可复现回归。',
      input: 'TransformReportView.unresolvedCandidates + TransformReportView.warnings',
      output: 'json-helper-transform-issue-samples + Vitest regression template',
      dependsOn: [reportDependency],
      enabled: true,
    }));
  }

  steps.push(
    createRecipeStep({
      id: 'save-quality-snapshot',
      label: '保存质量快照',
      action: 'copy-quality-snapshot',
      description: '复制不含原始值的质量指标，作为后续优化、占位符回填或规则迭代前后的对比基线。',
      input: 'TransformReportView',
      output: 'json-helper-transform-quality-snapshot',
      dependsOn: [reportDependency],
      enabled: true,
    }),
    createRecipeStep({
      id: 'archive-safe-artifacts',
      label: '归档安全材料',
      action: 'copy-archive-package',
      description: '复制诊断摘要、协作报告、质量快照、脱敏问题样本和 corpus 清单，不携带原始 response。',
      input: 'TransformReportView',
      output: 'json-helper-transform-archive-package',
      dependsOn: ['save-quality-snapshot'],
      enabled: true,
    })
  );

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
