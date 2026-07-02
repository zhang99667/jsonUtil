import { buildFocusedJsonValue } from './jsonPathFocus';
import { formatCmdHandlerCompatibleResult } from './schemeMetadata';
import type { TransformReportCmdStructureSource } from './transformReportCmdStructureSource';

export const createTransformRecordCmdStructureCopyTextGetter = (
  source: TransformReportCmdStructureSource,
  basePath: string
): ((focusedFieldPaths?: string[]) => string) => (focusedFieldPaths) => {
  const focusedValue = focusedFieldPaths?.length
    ? buildFocusedJsonValue(source.decodedValue, basePath, focusedFieldPaths)
    : null;

  return formatCmdHandlerCompatibleResult(
    JSON.stringify(focusedValue || source.decodedValue),
    source.commandSchema,
    source.source
  );
};
