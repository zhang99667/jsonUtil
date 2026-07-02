import React from 'react';
import type { TransformReportDecodedPath } from '../utils/transformSummary';
import { getDecodedPathSchemeInput } from '../utils/transformReportDecodedSchemeInput';
import { getTransformDecodedPathCopyText } from '../utils/transformReportCopyPayloads';
import { TransformReportActionButton } from './TransformReportActionButton';

export interface TransformReportRecordPathRowActionsProps {
  row: TransformReportDecodedPath;
  copyPathDataTour: string;
  copyValueDataTour: string;
  locateDataTour: string;
  schemeDataTour?: string;
  onCopyPath: (path: string) => void | Promise<void>;
  onCopyDecodedPathValue: (text: string) => void | Promise<void>;
  onLocatePath?: (path: string) => void;
  onOpenSchemeValue?: (value: string) => void;
}

export const TransformReportRecordPathRowActions: React.FC<TransformReportRecordPathRowActionsProps> = ({
  row, copyPathDataTour, copyValueDataTour, locateDataTour, schemeDataTour,
  onCopyPath, onCopyDecodedPathValue, onLocatePath, onOpenSchemeValue,
}) => {
  const schemeInput = schemeDataTour ? getDecodedPathSchemeInput(row) : null;

  return (
    <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
      <TransformReportActionButton
        data-tour={copyPathDataTour}
        onClick={() => { void onCopyPath(row.path); }}
      >
        复制路径
      </TransformReportActionButton>
      <TransformReportActionButton
        data-tour={copyValueDataTour}
        onClick={() => { void onCopyDecodedPathValue(getTransformDecodedPathCopyText(row)); }}
      >
        复制片段
      </TransformReportActionButton>
      {onOpenSchemeValue && schemeInput && schemeDataTour && (
        <TransformReportActionButton
          data-tour={schemeDataTour}
          onClick={() => onOpenSchemeValue(schemeInput)}
          tone="scheme"
        >
          Scheme 打开
        </TransformReportActionButton>
      )}
      {onLocatePath && (
        <TransformReportActionButton
          data-tour={locateDataTour}
          onClick={() => onLocatePath(row.path)}
          tone="locate"
        >
          定位
        </TransformReportActionButton>
      )}
    </div>
  );
};
