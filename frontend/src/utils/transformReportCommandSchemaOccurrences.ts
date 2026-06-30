import {
  createCommandSchemaOccurrence,
  createResourceFieldSchemaOccurrence,
  type CommandSchemaOccurrence,
} from './transformReportCommandSchemaOccurrenceFactory';
import type { TransformReportRecord } from './transformSummary';

export type {
  CommandSchemaOccurrence,
  CommandSchemaOccurrenceKind,
} from './transformReportCommandSchemaOccurrenceFactory';

const isCommandSchemaOccurrence = (
  occurrence: CommandSchemaOccurrence | null
): occurrence is CommandSchemaOccurrence => occurrence !== null;

export const collectCommandSchemaOccurrences = (
  records: TransformReportRecord[]
): CommandSchemaOccurrence[] => records.flatMap(record => [
  createCommandSchemaOccurrence(record.commandSchema, record.path, record.path),
  ...(record.commandSchemaRows ?? []).map(row => (
    createCommandSchemaOccurrence(row.schema, row.path, record.path)
  )),
  ...(record.nestedResourceSearchFields ?? []).map(row => (
    createResourceFieldSchemaOccurrence(row, record.path)
  )),
].filter(isCommandSchemaOccurrence));
