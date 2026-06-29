export type StructuredQueryValue =
  | string
  | number
  | boolean
  | null
  | StructuredQueryValue[]
  | { [key: string]: StructuredQueryValue };

export type StructuredQueryParamContainer = { [key: string]: StructuredQueryValue };

export type QueryKeySegment = string | number | null;
