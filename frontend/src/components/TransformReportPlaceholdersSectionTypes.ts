import type {
  TransformReportRuntimePlaceholder,
  TransformReportRuntimePlaceholderGroup,
} from '../utils/transformRuntimePlaceholderTypes';
import type { TransformReportPlaceholderToolbarProps } from './TransformReportPlaceholderToolbar';
import type { TransformReportPlaceholderRowProps } from './TransformReportPlaceholderRow';

export type TransformReportPlaceholdersToolbarProps =
  Omit<TransformReportPlaceholderToolbarProps, 'visiblePlaceholderCount'>;

export type TransformReportPlaceholdersRowProps =
  Omit<TransformReportPlaceholderRowProps, 'placeholder'>;

export interface TransformReportPlaceholdersSectionProps {
  runtimePlaceholderGroups: TransformReportRuntimePlaceholderGroup[];
  runtimePlaceholders: TransformReportRuntimePlaceholder[];
  toolbar: TransformReportPlaceholdersToolbarProps;
  rows: TransformReportPlaceholdersRowProps;
  onFilter: (query: string) => void;
}
