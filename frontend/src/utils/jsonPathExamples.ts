import { formatJsonPathRecursiveFieldQuery } from './jsonPathInput';
import { appendJsonPathIndex, appendJsonPathKey, isJsonPathIdentifier } from './jsonPathSegments';
import { isRecord, parseJsonWithFallback } from './storage';

export interface JsonPathScenarioExample {
  id: string;
  label: string;
  query: string;
  description: string;
}

interface ObjectArrayCandidate {
  path: string;
  itemPath: string;
  totalItems: number;
  records: Record<string, unknown>[];
}

interface FieldStats {
  key: string;
  count: number;
  stringValues: string[];
  numberValues: number[];
  booleanValues: boolean[];
}

const MAX_EXAMPLE_PARSE_LENGTH = 320_000;
const MAX_SCENARIO_EXAMPLES = 6;
const MAX_TRAVERSE_NODES = 1_200;
const MAX_ARRAY_SAMPLE_RECORDS = 12;
const PRIORITY_FIELD_NAMES = [
  'id',
  'name',
  'title',
  'type',
  'status',
  'state',
  'url',
  'action_cmd',
  'button_cmd',
  'cmdSchema',
  'traceId',
];

const tryParseJsonContainer = (jsonText: string): unknown | null => {
  if (jsonText.length > MAX_EXAMPLE_PARSE_LENGTH) return null;
  const source = jsonText.trim();
  if (!source) return null;

  return parseJsonWithFallback<unknown>(source, null);
};

const formatJsonPathFilterProperty = (key: string): string => (
  isJsonPathIdentifier(key) ? `@.${key}` : `@[${JSON.stringify(key)}]`
);

const formatPathLabel = (path: string): string => (
  path === '$'
    ? '根节点'
    : path
      .replace(/^\$\./, '')
      .replace(/^\$/, '根节点')
      .replace(/\[\*\]$/g, '')
      .slice(0, 24)
);

const getArrayRecords = (value: unknown[]): Record<string, unknown>[] => (
  value
    .filter(isRecord)
    .slice(0, MAX_ARRAY_SAMPLE_RECORDS)
);

const collectObjectArrayCandidates = (root: unknown): ObjectArrayCandidate[] => {
  const candidates: ObjectArrayCandidate[] = [];
  const stack: Array<{ value: unknown; path: string; depth: number }> = [{ value: root, path: '$', depth: 0 }];
  let visited = 0;

  while (stack.length > 0 && visited < MAX_TRAVERSE_NODES) {
    const current = stack.pop();
    if (!current) break;
    visited += 1;

    if (Array.isArray(current.value)) {
      const records = getArrayRecords(current.value);
      if (records.length > 0) {
        candidates.push({
          path: current.path,
          itemPath: current.path === '$' ? '$[*]' : `${current.path}[*]`,
          totalItems: current.value.length,
          records,
        });
      }

      current.value.slice(0, 30).forEach((item, index) => {
        stack.push({
          value: item,
          path: appendJsonPathIndex(current.path, index),
          depth: current.depth + 1,
        });
      });
      continue;
    }

    if (isRecord(current.value)) {
      Object.entries(current.value)
        .slice(0, 60)
        .reverse()
        .forEach(([key, child]) => {
          stack.push({
            value: child,
            path: appendJsonPathKey(current.path, key),
            depth: current.depth + 1,
          });
        });
    }
  }

  return candidates.sort((left, right) => (
    right.records.length - left.records.length ||
    left.path.length - right.path.length
  ));
};

const buildFieldStats = (records: Record<string, unknown>[]): FieldStats[] => {
  const stats = new Map<string, FieldStats>();

  records.forEach(record => {
    Object.entries(record).forEach(([key, value]) => {
      if (value === null || typeof value === 'object') return;
      const current = stats.get(key) || {
        key,
        count: 0,
        stringValues: [],
        numberValues: [],
        booleanValues: [],
      };

      current.count += 1;
      if (typeof value === 'string' && value && current.stringValues.length < 4) {
        current.stringValues.push(value);
      } else if (typeof value === 'number' && Number.isFinite(value) && current.numberValues.length < 4) {
        current.numberValues.push(value);
      } else if (typeof value === 'boolean' && current.booleanValues.length < 2) {
        current.booleanValues.push(value);
      }
      stats.set(key, current);
    });
  });

  return Array.from(stats.values()).sort((left, right) => {
    const leftPriority = PRIORITY_FIELD_NAMES.indexOf(left.key);
    const rightPriority = PRIORITY_FIELD_NAMES.indexOf(right.key);
    if (leftPriority !== -1 || rightPriority !== -1) {
      return (leftPriority === -1 ? 999 : leftPriority) - (rightPriority === -1 ? 999 : rightPriority);
    }
    return right.count - left.count || left.key.localeCompare(right.key);
  });
};

const collectFieldCounts = (root: unknown): Map<string, number> => {
  const counts = new Map<string, number>();
  const stack: unknown[] = [root];
  let visited = 0;

  while (stack.length > 0 && visited < MAX_TRAVERSE_NODES) {
    const value = stack.pop();
    visited += 1;

    if (Array.isArray(value)) {
      value.slice(0, 60).forEach(item => stack.push(item));
      continue;
    }

    if (isRecord(value)) {
      Object.entries(value).slice(0, 80).forEach(([key, child]) => {
        counts.set(key, (counts.get(key) || 0) + 1);
        stack.push(child);
      });
    }
  }

  return counts;
};

const getBestRecursiveField = (root: unknown, excludedKey?: string): string | null => {
  const counts = collectFieldCounts(root);
  const entries = Array.from(counts.entries())
    .filter(([key, count]) => key !== excludedKey && count > 1)
    .sort(([leftKey, leftCount], [rightKey, rightCount]) => {
      if (leftCount !== rightCount) return rightCount - leftCount;
      const leftPriority = PRIORITY_FIELD_NAMES.indexOf(leftKey);
      const rightPriority = PRIORITY_FIELD_NAMES.indexOf(rightKey);
      if (leftPriority !== -1 || rightPriority !== -1) {
        return (leftPriority === -1 ? 999 : leftPriority) - (rightPriority === -1 ? 999 : rightPriority);
      }
      return rightCount - leftCount || leftKey.localeCompare(rightKey);
    });

  return entries[0]?.[0] || null;
};

const getFilterExample = (candidate: ObjectArrayCandidate, stats: FieldStats[]): JsonPathScenarioExample | null => {
  const filterPath = candidate.path;
  const booleanField = stats.find(item => item.booleanValues.length > 0);
  if (booleanField) {
    const value = booleanField.booleanValues[0];
    return {
      id: `filter-${candidate.path}-${booleanField.key}`,
      label: `筛选 ${booleanField.key}`,
      query: `${filterPath}[?(${formatJsonPathFilterProperty(booleanField.key)} == ${value ? 'true' : 'false'})]`,
      description: `按布尔字段 ${booleanField.key} 过滤 ${formatPathLabel(candidate.path)}`,
    };
  }

  const statusField = stats.find(item => (
    /status|state|type/i.test(item.key) && item.stringValues.length > 0
  ));
  if (statusField) {
    return {
      id: `filter-${candidate.path}-${statusField.key}`,
      label: `筛选 ${statusField.key}`,
      query: `${filterPath}[?(${formatJsonPathFilterProperty(statusField.key)} == ${JSON.stringify(statusField.stringValues[0])})]`,
      description: `按状态字段 ${statusField.key} 过滤 ${formatPathLabel(candidate.path)}`,
    };
  }

  const numberField = stats.find(item => item.numberValues.length > 0);
  if (!numberField) return null;
  const threshold = Math.min(...numberField.numberValues);

  return {
    id: `filter-${candidate.path}-${numberField.key}`,
    label: `过滤 ${numberField.key}`,
    query: `${filterPath}[?(${formatJsonPathFilterProperty(numberField.key)} >= ${threshold})]`,
    description: `按数值字段 ${numberField.key} 过滤 ${formatPathLabel(candidate.path)}`,
  };
};

const dedupeExamples = (examples: JsonPathScenarioExample[]): JsonPathScenarioExample[] => {
  const seen = new Set<string>();
  return examples.filter(example => {
    if (seen.has(example.query)) return false;
    seen.add(example.query);
    return true;
  });
};

export const getJsonPathScenarioExamples = (jsonText: string): JsonPathScenarioExample[] => {
  const root = tryParseJsonContainer(jsonText);
  if (!root || (!Array.isArray(root) && !isRecord(root))) return [];

  const examples: JsonPathScenarioExample[] = [];
  const candidates = collectObjectArrayCandidates(root);
  const primaryCandidate = candidates[0];

  if (primaryCandidate) {
    examples.push({
      id: `iterate-${primaryCandidate.path}`,
      label: `遍历 ${formatPathLabel(primaryCandidate.path)}`,
      query: primaryCandidate.itemPath,
      description: `查看 ${formatPathLabel(primaryCandidate.path)} 下的 ${primaryCandidate.totalItems} 个对象项`,
    });

    const stats = buildFieldStats(primaryCandidate.records);
    const fieldExample = stats[0];
    if (fieldExample) {
      examples.push({
        id: `pick-${primaryCandidate.path}-${fieldExample.key}`,
        label: `提取 ${fieldExample.key}`,
        query: appendJsonPathKey(primaryCandidate.itemPath, fieldExample.key),
        description: `从 ${formatPathLabel(primaryCandidate.path)} 批量提取 ${fieldExample.key}`,
      });
    }

    const filterExample = getFilterExample(primaryCandidate, stats);
    if (filterExample) {
      examples.push(filterExample);
    }

    const recursiveField = getBestRecursiveField(root, fieldExample?.key);
    if (recursiveField) {
      examples.push({
        id: `recursive-${recursiveField}`,
        label: `全局 ${recursiveField}`,
        query: formatJsonPathRecursiveFieldQuery(recursiveField),
        description: `递归查询所有 ${recursiveField} 字段`,
      });
    }
  } else if (isRecord(root)) {
    examples.push({
      id: 'root-values',
      label: '根字段值',
      query: '$.*',
      description: '查看根对象下所有字段值',
    });
  }

  if (Array.isArray(root)) {
    examples.unshift({
      id: 'root-array',
      label: '根数组',
      query: '$[*]',
      description: `遍历根数组的 ${root.length} 项`,
    });
  }

  return dedupeExamples(examples).slice(0, MAX_SCENARIO_EXAMPLES);
};
