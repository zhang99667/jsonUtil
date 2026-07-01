import React from 'react';
import type { TransformReportRuntimePlaceholder } from '../utils/transformRuntimePlaceholderTypes';
import { TransformReportPlaceholderRow, type TransformReportPlaceholderRowProps } from './TransformReportPlaceholderRow';

export type TransformReportPlaceholderRowsProps =
  Omit<TransformReportPlaceholderRowProps, 'placeholder'>;

interface TransformReportPlaceholderRowsListProps extends TransformReportPlaceholderRowsProps {
  runtimePlaceholders: TransformReportRuntimePlaceholder[];
}

export const TransformReportPlaceholderRowsList: React.FC<TransformReportPlaceholderRowsListProps> = ({
  runtimePlaceholders,
  ...placeholderRowProps
}) => (
  <>
    {runtimePlaceholders.map(placeholder => (
      <TransformReportPlaceholderRow
        key={`${placeholder.path}:${placeholder.value}`}
        placeholder={placeholder}
        {...placeholderRowProps}
      />
    ))}
  </>
);
