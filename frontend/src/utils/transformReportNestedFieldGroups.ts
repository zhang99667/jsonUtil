import type {
  TransformReportDecodedPath,
  TransformReportNestedCommandFieldGroup,
  TransformReportRecord,
} from './transformSummary';
import { getJsonPathLeafKey } from './jsonPathFocus';

interface TransformReportNestedFieldGroupOptions {
  limit: number;
  pathLimit: number;
  getRows: (record: TransformReportRecord) => TransformReportDecodedPath[] | undefined;
}

interface NestedFieldGroupDraft {
  key: string;
  count: number;
  recordPaths: Set<string>;
  paths: string[];
  hasMorePaths: boolean;
}

const ensureNestedFieldGroup = (
  groups: Map<string, NestedFieldGroupDraft>,
  key: string
): NestedFieldGroupDraft => {
  const existing = groups.get(key);
  if (existing) return existing;

  const group: NestedFieldGroupDraft = {
    key,
    count: 0,
    recordPaths: new Set(),
    paths: [],
    hasMorePaths: false,
  };
  groups.set(key, group);
  return group;
};

export const buildTransformReportNestedFieldGroups = (
  records: TransformReportRecord[],
  options: TransformReportNestedFieldGroupOptions
): TransformReportNestedCommandFieldGroup[] => {
  const groups = new Map<string, NestedFieldGroupDraft>();

  records.forEach(record => {
    options.getRows(record)?.forEach(row => {
      const group = ensureNestedFieldGroup(groups, getJsonPathLeafKey(row.path));

      group.count += 1;
      group.recordPaths.add(record.path);
      if (group.paths.length < options.pathLimit) {
        group.paths.push(row.path);
      } else {
        group.hasMorePaths = true;
      }
    });
  });

  return Array.from(groups.values())
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key))
    .slice(0, options.limit)
    .map(group => ({
      key: group.key,
      count: group.count,
      recordCount: group.recordPaths.size,
      paths: group.paths,
      hasMorePaths: group.hasMorePaths,
    }));
};
