import React from 'react';
import type { TransformReportRuntimePlaceholderGroup } from '../utils/transformRuntimePlaceholderTypes';
import { TransformReportPlaceholderGroupCard } from './TransformReportPlaceholderGroupCard';

interface TransformReportPlaceholderGroupsListProps {
  runtimePlaceholderGroups: TransformReportRuntimePlaceholderGroup[];
  onFilter: (query: string) => void;
}

export const TransformReportPlaceholderGroupsList: React.FC<TransformReportPlaceholderGroupsListProps> = ({
  runtimePlaceholderGroups,
  onFilter,
}) => (
  <div data-tour="transform-report-placeholder-groups" className="grid gap-1.5">
    {runtimePlaceholderGroups.map(group => (
      <TransformReportPlaceholderGroupCard
        key={group.value}
        group={group}
        onFilter={onFilter}
      />
    ))}
  </div>
);
