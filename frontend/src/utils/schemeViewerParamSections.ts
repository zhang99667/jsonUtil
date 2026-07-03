import type { SchemeDecodeResult } from './schemeTypes';

type SchemeParams = NonNullable<SchemeDecodeResult['schemeInfo']>['params'];

export interface SchemeViewerParamSection {
  title: string;
  params: SchemeParams;
}

export const getSchemeViewerParamCount = (params: SchemeParams): number => {
  if (!params) return 0;

  return Object.values(params).reduce((count, value) => (
    count + (Array.isArray(value) ? value.length : 1)
  ), 0);
};

export const getSchemeViewerParamEntries = (
  params: SchemeParams
): Array<[string, string | string[]]> => (
  Object.entries(params || {}) as Array<[string, string | string[]]>
);

export const buildSchemeViewerParamSections = (
  schemeInfo: SchemeDecodeResult['schemeInfo']
): SchemeViewerParamSection[] => {
  if (!schemeInfo) return [];

  return [
    { title: 'Query 参数', params: schemeInfo.params },
    { title: 'Hash 参数', params: schemeInfo.hashParams },
  ].filter(section => getSchemeViewerParamCount(section.params) > 0);
};
