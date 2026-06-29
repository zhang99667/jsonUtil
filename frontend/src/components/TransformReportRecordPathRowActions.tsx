import React from 'react';
import type { TransformReportDecodedPath } from '../utils/transformSummary';
import { getDecodedPathSchemeInput } from '../utils/transformReportDecodedSchemeInput';
import { getTransformDecodedPathCopyText } from '../utils/transformReportCopyPayloads';

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
  row,
  copyPathDataTour,
  copyValueDataTour,
  locateDataTour,
  schemeDataTour,
  onCopyPath,
  onCopyDecodedPathValue,
  onLocatePath,
  onOpenSchemeValue,
}) => {
  const schemeInput = schemeDataTour ? getDecodedPathSchemeInput(row) : null;

  return (
    <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
      <button
        type="button"
        data-tour={copyPathDataTour}
        onClick={() => { void onCopyPath(row.path); }}
        className="text-gray-400 hover:text-cyan-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
      >
        复制路径
      </button>
      <button
        type="button"
        data-tour={copyValueDataTour}
        onClick={() => { void onCopyDecodedPathValue(getTransformDecodedPathCopyText(row)); }}
        className="text-gray-400 hover:text-cyan-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
      >
        复制片段
      </button>
      {onOpenSchemeValue && schemeInput && schemeDataTour && (
        <button
          type="button"
          data-tour={schemeDataTour}
          onClick={() => onOpenSchemeValue(schemeInput)}
          className="text-gray-400 hover:text-violet-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
        >
          Scheme 打开
        </button>
      )}
      {onLocatePath && (
        <button
          type="button"
          data-tour={locateDataTour}
          onClick={() => onLocatePath(row.path)}
          className="text-gray-400 hover:text-emerald-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
        >
          定位
        </button>
      )}
    </div>
  );
};
