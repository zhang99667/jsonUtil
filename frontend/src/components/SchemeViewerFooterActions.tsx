import React from 'react';
import {
  SchemeViewerFooterActionList,
  type SchemeViewerFooterActionListProps,
} from './SchemeViewerFooterActionList';

interface SchemeViewerFooterActionsProps extends SchemeViewerFooterActionListProps {
  decodeStatusText: string;
  onClose: () => void;
}

export const SchemeViewerFooterActions: React.FC<SchemeViewerFooterActionsProps> = ({
  decodeStatusText,
  onClose,
  ...actionListProps
}) => (
  <div className="flex w-full flex-wrap items-center justify-between gap-2">
    <div data-tour="scheme-decode-status" className="shrink-0 text-xs text-gray-500">
      {decodeStatusText}
    </div>
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
      <button
        type="button"
        data-tour="scheme-close-button"
        onClick={onClose}
        className="shrink-0 whitespace-nowrap px-2.5 py-1 text-sm text-gray-400 transition-colors hover:text-white"
        title="关闭 Scheme 解析"
        aria-label="关闭 Scheme 解析"
      >
        关闭
      </button>
      <SchemeViewerFooterActionList {...actionListProps} />
    </div>
  </div>
);
