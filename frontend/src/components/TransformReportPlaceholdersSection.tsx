import React from 'react';
import { TransformReportPlaceholderGroupsList } from './TransformReportPlaceholderGroupsList';
import { TransformReportPlaceholderRowsList } from './TransformReportPlaceholderRowsList';
import { TransformReportPlaceholderToolbar } from './TransformReportPlaceholderToolbar';
import type { TransformReportPlaceholdersSectionProps } from './TransformReportPlaceholdersSectionTypes';

export const TransformReportPlaceholdersSection: React.FC<TransformReportPlaceholdersSectionProps> = ({
  runtimePlaceholderGroups,
  runtimePlaceholders,
  toolbar,
  rows,
  onFilter,
}) => (
  <div data-tour="transform-report-placeholders" className="flex flex-col gap-1.5">
    <TransformReportPlaceholderToolbar
      {...toolbar}
      visiblePlaceholderCount={runtimePlaceholders.length}
    />
    <TransformReportPlaceholderGroupsList
      runtimePlaceholderGroups={runtimePlaceholderGroups}
      onFilter={onFilter}
    />
    <TransformReportPlaceholderRowsList
      runtimePlaceholders={runtimePlaceholders}
      {...rows}
    />
  </div>
);
