export interface TransformReportRuntimePlaceholder {
  path: string;
  sourcePath: string;
  sourceLabel?: string;
  sourceOriginalValue?: string;
  sourceOriginalPreview?: string;
  value: string;
  description: string;
}

export interface TransformReportRuntimePlaceholderSourceGroup {
  sourcePath: string;
  sourceLabel?: string;
  sourceOriginalValue?: string;
  sourceOriginalPreview?: string;
  count: number;
}

export interface TransformReportRuntimePlaceholderGroup {
  value: string;
  description: string;
  count: number;
  sourceCount: number;
  sources: TransformReportRuntimePlaceholderSourceGroup[];
}
