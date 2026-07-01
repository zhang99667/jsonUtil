import type {
  TransformReportRuntimePlaceholder,
  TransformReportRuntimePlaceholderGroup,
} from '../utils/transformRuntimePlaceholderTypes';
import type { TransformReportPlaceholderToolbarProps } from './TransformReportPlaceholderToolbar';
import type { TransformReportPlaceholderRowsProps } from './TransformReportPlaceholderRowsList';

export type TransformReportPlaceholdersToolbarProps =
  Omit<TransformReportPlaceholderToolbarProps, 'visiblePlaceholderCount'>;

export interface TransformReportPlaceholdersSectionProps {
  runtimePlaceholderGroups: TransformReportRuntimePlaceholderGroup[];
  runtimePlaceholders: TransformReportRuntimePlaceholder[];
  toolbar: TransformReportPlaceholdersToolbarProps;
  rows: TransformReportPlaceholderRowsProps;
  onFilter: (query: string) => void;
}
