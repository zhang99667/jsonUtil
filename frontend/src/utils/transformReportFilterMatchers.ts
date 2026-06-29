import { getResourceTypeSearchTokens } from './staticResourceSchema';
import type {
  TransformReportCommandSchemaRow,
  TransformReportDecodedPath,
  TransformReportResourceType,
} from './transformSummary';

export const CMD_STRUCTURE_SEARCH_TEXT = 'CMD结构 cmdHandler cmdParams cmdSchema';
export const NESTED_CMD_SEARCH_TEXT = '内部CMD字段 内部CMD cmd解析';
export const NESTED_RESOURCE_SEARCH_TEXT = '资源URL 静态资源字段 资源字段 resource url';

export const includesQuery = (value: string, normalizedQuery: string): boolean => (
  value.toLowerCase().includes(normalizedQuery)
);

export const isIssuePriorityQuery = (normalizedQuery: string): boolean => (
  normalizedQuery === '待处理' || normalizedQuery === '问题优先'
);

export const matchesResourceType = (
  resourceType: TransformReportResourceType | undefined,
  normalizedQuery: string
): boolean => {
  if (!resourceType) return false;
  return getResourceTypeSearchTokens(resourceType).some(token => token.includes(normalizedQuery));
};

// 短字段名扫整段原始 CMD 会把同源诊断项全部带出；仅对长片段或明显编码/URL 片段兜底。
export const shouldSearchLongSourceValue = (normalizedQuery: string): boolean => (
  normalizedQuery.length >= 12 ||
  /[%=&?/:#{}[\]"'\\.]/.test(normalizedQuery)
);

export const matchesDecodedPath = (
  row: TransformReportDecodedPath,
  normalizedQuery: string
): boolean => (
  includesQuery(row.path, normalizedQuery) ||
  includesQuery(row.preview, normalizedQuery) ||
  matchesResourceType(row.resourceType, normalizedQuery)
);

export const matchesNestedCommandField = (
  row: TransformReportDecodedPath,
  normalizedQuery: string
): boolean => (
  includesQuery(row.path, normalizedQuery) ||
  matchesResourceType(row.resourceType, normalizedQuery) ||
  (!row.preview.startsWith('对象:') &&
    !row.preview.startsWith('数组 ') &&
    includesQuery(row.preview, normalizedQuery))
);

export const matchesCommandSchemaRow = (
  row: TransformReportCommandSchemaRow,
  normalizedQuery: string,
  getCommandSchemaOrigin: (schema: string) => string
): boolean => (
  includesQuery(row.path, normalizedQuery) ||
  includesQuery(row.schema, normalizedQuery) ||
  includesQuery(getCommandSchemaOrigin(row.schema), normalizedQuery)
);
