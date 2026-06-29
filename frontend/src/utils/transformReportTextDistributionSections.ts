import type {
  TransformReportCommandSchemaGroup,
  TransformReportCommandSchemaOriginGroup,
  TransformReportNestedCommandFieldGroup,
  TransformReportResourceTypeGroup,
} from './transformSummary';

export const appendCommandSchemaOriginSummarySection = (
  lines: string[],
  groups: TransformReportCommandSchemaOriginGroup[]
) => {
  if (groups.length === 0) return;

  lines.push('CMD 来源分布:');
  groups.forEach(group => {
    lines.push(`- ${group.origin} ×${group.count}（Schema ${group.schemaCount} / 来源记录 ${group.recordCount}）`);
    lines.push(`  示例Schema: ${group.schemas.join('；')}${group.hasMoreSchemas ? '；...' : ''}`);
  });
  lines.push('');
};

export const appendCommandSchemaSummarySection = (
  lines: string[],
  groups: TransformReportCommandSchemaGroup[]
) => {
  if (groups.length === 0) return;

  lines.push('CMD Schema 分布:');
  groups.forEach(group => {
    lines.push(`- ${group.schema} ×${group.count}（来源记录 ${group.recordCount}）`);
    lines.push(`  示例路径: ${group.paths.join('；')}${group.hasMorePaths ? '；...' : ''}`);
  });
  lines.push('');
};

export const formatResourceSchemaGroupTitle = (group: TransformReportCommandSchemaGroup): string => (
  group.resourceTypeLabel ? `[${group.resourceTypeLabel}] ${group.schema}` : group.schema
);

export const appendResourceTypeSummarySection = (
  lines: string[],
  groups: TransformReportResourceTypeGroup[]
) => {
  if (groups.length === 0) return;

  lines.push('静态资源类型分布:');
  groups.forEach(group => {
    lines.push(
      `- ${group.resourceTypeLabel} ${group.percentage}% ×${group.count}（URL ${group.schemaCount} / 来源记录 ${group.recordCount}）`
    );
    lines.push(`  示例URL: ${group.schemas.join('；')}${group.hasMoreSchemas ? '；...' : ''}`);
  });
  lines.push('');
};

export const appendResourceSchemaSummarySection = (
  lines: string[],
  groups: TransformReportCommandSchemaGroup[]
) => {
  if (groups.length === 0) return;

  lines.push('静态资源 URL 分布:');
  groups.forEach(group => {
    lines.push(`- ${formatResourceSchemaGroupTitle(group)} ×${group.count}（来源记录 ${group.recordCount}）`);
    lines.push(`  示例路径: ${group.paths.join('；')}${group.hasMorePaths ? '；...' : ''}`);
  });
  lines.push('');
};

export const appendNestedCommandFieldSummarySection = (
  lines: string[],
  groups: TransformReportNestedCommandFieldGroup[]
) => {
  if (groups.length === 0) return;

  lines.push('内部CMD字段分布:');
  groups.forEach(group => {
    lines.push(`- ${group.key} ×${group.count}（来源记录 ${group.recordCount}）`);
    lines.push(`  示例路径: ${group.paths.join('；')}${group.hasMorePaths ? '；...' : ''}`);
  });
  lines.push('');
};

export const appendNestedResourceFieldSummarySection = (
  lines: string[],
  groups: TransformReportNestedCommandFieldGroup[]
) => {
  if (groups.length === 0) return;

  lines.push('静态资源字段分布:');
  groups.forEach(group => {
    lines.push(`- ${group.key} ×${group.count}（来源记录 ${group.recordCount}）`);
    lines.push(`  示例路径: ${group.paths.join('；')}${group.hasMorePaths ? '；...' : ''}`);
  });
  lines.push('');
};
