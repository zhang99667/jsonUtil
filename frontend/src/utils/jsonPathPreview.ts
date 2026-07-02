const MAX_RESULT_PREVIEW_LENGTH = 240;
const MAX_COMPACT_RESULT_PREVIEW_LENGTH = 96;
const MAX_TOKEN_PREVIEW_LENGTH = 32;
const MAX_DETAILED_PREVIEW_TOTAL_LENGTH = 1200;
const MAX_DETAILED_PREVIEW_STRING_LENGTH = 512;
const MAX_DETAILED_PREVIEW_ARRAY_ITEMS = 8;
const MAX_DETAILED_PREVIEW_OBJECT_KEYS = 10;
const MAX_DETAILED_PREVIEW_DEPTH = 3;

const compactText = (text: string, maxLength = MAX_RESULT_PREVIEW_LENGTH): string => (
  text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
);

const stringifyJsonValue = (value: unknown, pretty = false): string => {
  const text = JSON.stringify(value, null, pretty ? 2 : 0);
  return text ?? String(value);
};

interface PreviewBudget {
  remaining: number;
}

const canUseDetailedPreviewWithBudget = (
  value: unknown,
  budget: PreviewBudget,
  depth = 0
): boolean => {
  if (typeof value === 'string') {
    budget.remaining -= value.length;
    return value.length <= MAX_DETAILED_PREVIEW_STRING_LENGTH && budget.remaining >= 0;
  }

  if (value === null || typeof value !== 'object') {
    budget.remaining -= stringifyJsonValue(value).length;
    return budget.remaining >= 0;
  }

  if (depth >= MAX_DETAILED_PREVIEW_DEPTH) return false;

  if (Array.isArray(value)) {
    if (value.length > MAX_DETAILED_PREVIEW_ARRAY_ITEMS) return false;
    budget.remaining -= value.length * 4;
    if (budget.remaining < 0) return false;

    return value.every(item => canUseDetailedPreviewWithBudget(item, budget, depth + 1));
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length > MAX_DETAILED_PREVIEW_OBJECT_KEYS) return false;

  for (const key of keys) {
    budget.remaining -= key.length;
    if (budget.remaining < 0) return false;
    if (!canUseDetailedPreviewWithBudget(record[key], budget, depth + 1)) return false;
  }

  return true;
};

const canUseDetailedPreview = (value: unknown): boolean => (
  canUseDetailedPreviewWithBudget(value, { remaining: MAX_DETAILED_PREVIEW_TOTAL_LENGTH })
);

const formatPreviewToken = (value: unknown): string => {
  if (typeof value === 'string') {
    return stringifyJsonValue(compactText(value, MAX_TOKEN_PREVIEW_LENGTH));
  }

  if (value === null || typeof value !== 'object') {
    return stringifyJsonValue(value);
  }

  if (Array.isArray(value)) {
    return `数组(${value.length})`;
  }

  return `对象(${Object.keys(value as Record<string, unknown>).length})`;
};

const formatStructuredPreview = (value: unknown): string => {
  if (Array.isArray(value)) {
    if (value.length === 0) return '数组: 空';

    const visibleItems = value
      .slice(0, MAX_DETAILED_PREVIEW_ARRAY_ITEMS)
      .map(formatPreviewToken)
      .join(', ');
    const suffix = value.length > MAX_DETAILED_PREVIEW_ARRAY_ITEMS ? ', ...' : '';
    return compactText(`数组(${value.length}): ${visibleItems}${suffix}`);
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length === 0) return '对象: 空';

  const visiblePairs = keys
    .slice(0, MAX_DETAILED_PREVIEW_OBJECT_KEYS)
    .map(key => `${compactText(key, MAX_TOKEN_PREVIEW_LENGTH)}: ${formatPreviewToken(record[key])}`)
    .join(', ');
  const suffix = keys.length > MAX_DETAILED_PREVIEW_OBJECT_KEYS ? ', ...' : '';

  return compactText(`对象(${keys.length}): ${visiblePairs}${suffix}`);
};

/**
 * 小结果保留 JSON 明细，大对象/大数组只展示结构摘要，避免结果面板为根节点 stringify 整段 response。
 */
export const formatJsonPathValueForPreview = (value: unknown): string => {
  if (typeof value === 'string') {
    return compactText(value);
  }

  if (value !== null && typeof value === 'object' && !canUseDetailedPreview(value)) {
    return formatStructuredPreview(value);
  }

  return compactText(stringifyJsonValue(value, true));
};

/**
 * 查询面板结果列表只保留轻量预览，避免对象结构摘要抢占垂直空间。
 */
export const formatJsonPathValueForCompactPreview = (value: unknown): string => {
  if (typeof value === 'string') {
    return compactText(value, MAX_COMPACT_RESULT_PREVIEW_LENGTH);
  }

  if (Array.isArray(value)) {
    return `数组(${value.length})`;
  }

  if (value !== null && typeof value === 'object') {
    return `对象(${Object.keys(value as Record<string, unknown>).length})`;
  }

  return compactText(stringifyJsonValue(value), MAX_COMPACT_RESULT_PREVIEW_LENGTH);
};
