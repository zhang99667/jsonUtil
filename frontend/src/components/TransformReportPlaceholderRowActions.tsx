import React from 'react';
import type { TransformReportRuntimePlaceholder } from '../utils/transformRuntimePlaceholderTypes';
import { TransformReportActionButton } from './TransformReportActionButton';

export interface TransformReportPlaceholderRowActionsProps {
  placeholder: TransformReportRuntimePlaceholder;
  onCopyPath: (path: string, successMessage?: string) => void | Promise<void>;
  onCopyOriginalValue: (value: string, successMessage?: string) => void | Promise<void>;
  onLocatePath?: (path: string) => void;
  onOpenSchemeValue?: (value: string) => void;
}

export const TransformReportPlaceholderRowActions: React.FC<TransformReportPlaceholderRowActionsProps> = ({
  placeholder,
  onCopyPath,
  onCopyOriginalValue,
  onLocatePath,
  onOpenSchemeValue,
}) => (
  <>
    <TransformReportActionButton
      data-tour="transform-report-copy-placeholder-path"
      onClick={() => { void onCopyPath(placeholder.path); }}
    >
      复制路径
    </TransformReportActionButton>
    {onLocatePath && (
      <TransformReportActionButton
        data-tour="transform-report-locate-placeholder-path"
        onClick={() => onLocatePath(placeholder.path)}
        tone="locate"
      >
        定位
      </TransformReportActionButton>
    )}
    <TransformReportActionButton
      data-tour="transform-report-copy-placeholder-source-path"
      onClick={() => { void onCopyPath(placeholder.sourcePath, '已复制来源路径'); }}
    >
      复制来源
    </TransformReportActionButton>
    {onLocatePath && (
      <TransformReportActionButton
        data-tour="transform-report-locate-placeholder-source"
        onClick={() => onLocatePath(placeholder.sourcePath)}
        tone="locate"
      >
        定位来源
      </TransformReportActionButton>
    )}
    {placeholder.sourceOriginalValue && (
      <TransformReportActionButton
        data-tour="transform-report-copy-placeholder-source-value"
        onClick={() => { void onCopyOriginalValue(placeholder.sourceOriginalValue || '', '已复制来源值'); }}
      >
        复制来源值
      </TransformReportActionButton>
    )}
    {onOpenSchemeValue && placeholder.sourceOriginalValue && (
      <TransformReportActionButton
        data-tour="transform-report-open-placeholder-source-scheme"
        onClick={() => onOpenSchemeValue(placeholder.sourceOriginalValue || '')}
        tone="scheme"
      >
        Scheme 打开来源
      </TransformReportActionButton>
    )}
  </>
);
