import React from 'react';
import type { TransformReportRuntimePlaceholder } from '../utils/transformRuntimePlaceholderTypes';
import { TransformReportPlaceholderRow, type TransformReportPlaceholderRowProps } from './TransformReportPlaceholderRow';

interface TransformReportPlaceholderRowsListProps
  extends Omit<TransformReportPlaceholderRowProps, 'placeholder'> {
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
