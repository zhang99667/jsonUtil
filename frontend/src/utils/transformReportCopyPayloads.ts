import type { JsonValue } from '../types';
import { APP_VERSION_METADATA } from './appVersion';
import { buildCmdComparisonSuggestedCommands } from './transformSuggestedCommands';
import { formatDecodedPathCopyValue } from './transformValuePreview';
import type {
  TransformReportDecodedPath,
  TransformReportRecord,
} from './transformSummary';

export const getTransformDecodedPathCopyText = (
  row: TransformReportDecodedPath
): string => {
  if (row.copyText !== undefined) return row.copyText;

  const value = Object.prototype.hasOwnProperty.call(row, 'value')
    ? row.value as JsonValue
    : row.preview;
  return `${row.path} = ${formatDecodedPathCopyValue(value)}`;
};

export const getTransformPathValueCopyRows = (
  record: TransformReportRecord
): TransformReportDecodedPath[] => (
  record.cmdStructureFocusLabel === '内部 CMD 字段' && record.nestedCommandSearchFields?.length
    ? record.nestedCommandSearchFields
    : record.decodedSearchPaths || record.decodedPaths
);

export const getTransformRecordCmdStructureCopyText = (
  record: TransformReportRecord
): string => (
  record.cmdStructureFocusPaths?.length
    ? record.getCmdStructureCopyText?.(record.cmdStructureFocusPaths) ||
      record.cmdStructureCopyText ||
      ''
    : record.cmdStructureCopyText || record.getCmdStructureCopyText?.() || ''
);

export const formatTransformCmdStructureComparisonPackageText = (
  record: TransformReportRecord
): string => {
  const cmdStructureCopyText = getTransformRecordCmdStructureCopyText(record);
  if (!cmdStructureCopyText) return '';

  try {
    return JSON.stringify({
      schemaVersion: 1,
      kind: 'json-helper-cmd-structure-comparison-package',
      tool: APP_VERSION_METADATA,
      path: record.path,
      ...(record.sourceLabel ? { sourceLabel: record.sourceLabel } : {}),
      suggestedCommands: buildCmdComparisonSuggestedCommands(),
      actual: JSON.parse(cmdStructureCopyText) as unknown,
      expected: {},
    }, null, 2);
  } catch {
    return '';
  }
};
