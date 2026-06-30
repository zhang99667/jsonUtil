import React from 'react';
import type {
  TransformContextReport,
} from '../utils/transformSummary';
import {
  TransformReportPanelSections,
} from './TransformReportPanelSections';
import type { TransformReportPanelSectionsProps } from './TransformReportPanelSectionsTypes';

type TransformReportPanelContentProps = Omit<TransformReportPanelSectionsProps, 'report'> & {
  report: TransformContextReport | null;
};

export const TransformReportPanelContent: React.FC<TransformReportPanelContentProps> = ({
  report,
  ...sectionsProps
}) => (
  <div className="flex-1 min-h-0 overflow-y-auto bg-editor-bg p-3">
    {!report ? (
      <div className="h-full flex items-center justify-center text-xs text-gray-500">
        暂无深度解析上下文
      </div>
    ) : (
      <TransformReportPanelSections report={report} {...sectionsProps} />
    )}
  </div>
);
