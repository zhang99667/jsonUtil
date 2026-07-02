import type { TransformReportCommandSchemaRow, TransformReportDecodedPath, TransformReportRecord } from './transformSummary';
import type { TransformReportFilterViewMatches } from './transformReportFilterViewMatches';

type CmdStructureFocusRow = TransformReportCommandSchemaRow | TransformReportDecodedPath;

const getCmdStructureFocusRows = (
  matches: TransformReportFilterViewMatches
): { rows: CmdStructureFocusRow[]; label: string } => {
  if (matches.nestedCommandFields.length > 0) {
    return { rows: matches.nestedCommandFields, label: '内部 CMD 字段' };
  }
  if (matches.commandSchemaRows.length > 0) {
    return { rows: matches.commandSchemaRows, label: 'CMD Schema' };
  }
  return { rows: matches.decodedPaths, label: '内部路径' };
};

export const buildCmdStructureFocusPatch = (
  record: TransformReportRecord,
  matches: TransformReportFilterViewMatches
): Partial<TransformReportRecord> => {
  const focus = getCmdStructureFocusRows(matches);
  return record.hasCmdStructure && focus.rows.length > 0
    ? {
        cmdStructureFocusPaths: focus.rows.map(row => row.path),
        cmdStructureFocusCount: focus.rows.length,
        cmdStructureFocusLabel: focus.label,
      }
    : {};
};
