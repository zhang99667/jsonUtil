import { formatResourceSchemaGroupTitle } from './transformReportTextSections';
import type { TransformQualitySnapshot } from './transformSummary';

const COLLABORATION_TOP_LIMIT = 5;

const pushTopSection = <T>(
  lines: string[],
  title: string,
  groups: T[],
  formatGroup: (group: T) => string
) => {
  if (groups.length === 0) return;

  lines.push(title);
  groups.slice(0, COLLABORATION_TOP_LIMIT).forEach(group => {
    lines.push(`  - ${formatGroup(group)}`);
  });
};

export const buildCollaborationQualitySnapshotLines = (
  qualitySnapshot: TransformQualitySnapshot
): string[] => {
  const lines = [
    `- 覆盖: ${qualitySnapshot.coverage.score} (${qualitySnapshot.coverage.level})，${qualitySnapshot.coverage.description}`,
    `- 全量规模: 展开 ${qualitySnapshot.totals.records}，CMD结构 ${qualitySnapshot.totals.cmdStructures}，内部CMD字段 ${qualitySnapshot.totals.nestedCommandFields}，资源字段 ${qualitySnapshot.totals.nestedResourceFields}，占位符 ${qualitySnapshot.totals.runtimePlaceholders}，参数层 ${qualitySnapshot.totals.schemeParamStages}，参数修复 ${qualitySnapshot.totals.schemeParamStageRepairHints}，待检查 ${qualitySnapshot.totals.unresolved}，跳过 ${qualitySnapshot.totals.warnings}`,
    `- 当前筛选: 展开 ${qualitySnapshot.filtered.records}，CMD结构 ${qualitySnapshot.filtered.cmdStructures}，内部CMD字段 ${qualitySnapshot.filtered.nestedCommandFields}，资源字段 ${qualitySnapshot.filtered.nestedResourceFields}，占位符 ${qualitySnapshot.filtered.runtimePlaceholders}，参数层 ${qualitySnapshot.filtered.schemeParamStages}，参数修复 ${qualitySnapshot.filtered.schemeParamStageRepairHints}，待检查 ${qualitySnapshot.filtered.unresolved}，跳过 ${qualitySnapshot.filtered.warnings}`,
  ];

  pushTopSection(lines, '- CMD Schema Top:', qualitySnapshot.hotspots.topCommandSchemas, group => (
    `${group.schema} ×${group.count}`
  ));
  pushTopSection(lines, '- 静态资源 URL Top:', qualitySnapshot.hotspots.topResourceSchemas, group => (
    `${formatResourceSchemaGroupTitle(group)} ×${group.count}`
  ));
  pushTopSection(lines, '- 静态资源类型 Top:', qualitySnapshot.hotspots.topResourceTypes, group => (
    `${group.resourceTypeLabel} ${group.percentage}% ×${group.count}`
  ));
  pushTopSection(lines, '- 内部 CMD 字段 Top:', qualitySnapshot.hotspots.topNestedCommandFields, group => (
    `${group.key} ×${group.count}`
  ));

  if (qualitySnapshot.hotspots.schemeParamStageRepairHints.length > 0) {
    pushTopSection(lines, '- 参数分层修复 Top:', qualitySnapshot.hotspots.schemeParamStageRepairHints, group => (
      `${group.key} ×${group.count}`
    ));
  } else {
    pushTopSection(lines, '- 参数分层 Key Top:', qualitySnapshot.hotspots.schemeParamStageKeys, group => (
      `${group.key} ×${group.count}`
    ));
  }

  pushTopSection(lines, '- 建议动作:', qualitySnapshot.recommendations, recommendation => recommendation);

  return lines;
};
