import { getUrlResourceSchemaFromUrl } from './schemeMetadata';
import {
  getResourceTypeLabel,
  getStaticResourceType,
} from './staticResourceSchema';
import type { TransformReportDecodedPath } from './transformSummaryTypes';

export const getTransformReportResourceSchemaFromDecodedPath = (
  row: TransformReportDecodedPath
): string | undefined => {
  const schemaSource = typeof row.sourceValue === 'string'
    ? row.sourceValue
    : typeof row.value === 'string'
      ? row.value
      : undefined;

  return schemaSource ? getUrlResourceSchemaFromUrl(schemaSource) : undefined;
};

export const withTransformReportDecodedPathResourceType = (
  row: TransformReportDecodedPath
): TransformReportDecodedPath => {
  const schema = getTransformReportResourceSchemaFromDecodedPath(row);
  if (!schema) return row;

  const resourceType = getStaticResourceType(schema, row.path);
  return {
    ...row,
    resourceType,
    resourceTypeLabel: getResourceTypeLabel(resourceType),
  };
};
