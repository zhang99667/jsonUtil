import React from 'react';
import type {
  TransformReportRuntimePlaceholder,
  TransformReportRuntimePlaceholderGroup,
} from '../utils/transformRuntimePlaceholderTypes';
import { TransformReportPlaceholderGroupCard } from './TransformReportPlaceholderGroupCard';
import {
  TransformReportPlaceholderRow,
  type TransformReportPlaceholderRowProps,
} from './TransformReportPlaceholderRow';
import { TransformReportPlaceholderToolbar } from './TransformReportPlaceholderToolbar';

interface TransformReportPlaceholdersSectionProps
  extends Omit<TransformReportPlaceholderRowProps, 'placeholder'> {
  runtimePlaceholderGroups: TransformReportRuntimePlaceholderGroup[];
  runtimePlaceholders: TransformReportRuntimePlaceholder[];
  filteredPlaceholderCount: number;
  isPlaceholderTruncated: boolean;
  canShowOpenTemplateFill: boolean;
  isPlaceholderFillTemplateDisabled: boolean;
  isCopyPlaceholderReportDisabled: boolean;
  openTemplateFillTitle: string;
  copyTemplateTitle: string;
  copyPlaceholderReportTitle: string;
  onOpenPlaceholderFillTemplate: () => void;
  onCopyPlaceholderFillTemplate: () => void | Promise<void>;
  onCopyPlaceholderReport: () => void | Promise<void>;
  onFilter: (query: string) => void;
}

export const TransformReportPlaceholdersSection: React.FC<TransformReportPlaceholdersSectionProps> = ({
  runtimePlaceholderGroups,
  runtimePlaceholders,
  filteredPlaceholderCount,
  isPlaceholderTruncated,
  canShowOpenTemplateFill,
  isPlaceholderFillTemplateDisabled,
  isCopyPlaceholderReportDisabled,
  openTemplateFillTitle,
  copyTemplateTitle,
  copyPlaceholderReportTitle,
  onOpenPlaceholderFillTemplate,
  onCopyPlaceholderFillTemplate,
  onCopyPlaceholderReport,
  onFilter,
  ...placeholderRowProps
}) => (
  <div data-tour="transform-report-placeholders" className="flex flex-col gap-1.5">
    <TransformReportPlaceholderToolbar
      filteredPlaceholderCount={filteredPlaceholderCount}
      visiblePlaceholderCount={runtimePlaceholders.length}
      isPlaceholderTruncated={isPlaceholderTruncated}
      canShowOpenTemplateFill={canShowOpenTemplateFill}
      isPlaceholderFillTemplateDisabled={isPlaceholderFillTemplateDisabled}
      isCopyPlaceholderReportDisabled={isCopyPlaceholderReportDisabled}
      openTemplateFillTitle={openTemplateFillTitle}
      copyTemplateTitle={copyTemplateTitle}
      copyPlaceholderReportTitle={copyPlaceholderReportTitle}
      onOpenPlaceholderFillTemplate={onOpenPlaceholderFillTemplate}
      onCopyPlaceholderFillTemplate={onCopyPlaceholderFillTemplate}
      onCopyPlaceholderReport={onCopyPlaceholderReport}
    />

    <div data-tour="transform-report-placeholder-groups" className="grid gap-1.5">
      {runtimePlaceholderGroups.map(group => (
        <TransformReportPlaceholderGroupCard
          key={group.value}
          group={group}
          onFilter={onFilter}
        />
      ))}
    </div>

    {runtimePlaceholders.map(placeholder => (
      <TransformReportPlaceholderRow
        key={`${placeholder.path}:${placeholder.value}`}
        placeholder={placeholder}
        {...placeholderRowProps}
      />
    ))}
  </div>
);
