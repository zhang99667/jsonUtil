import React from 'react';
import {
  buildSchemeViewerFooterActionItems,
  type SchemeViewerFooterActionListProps,
} from './schemeViewerFooterActionItems';
import { SchemeViewerFooterActionButton } from './SchemeViewerFooterActionButton';

export type { SchemeViewerFooterActionListProps };

export const SchemeViewerFooterActionList: React.FC<SchemeViewerFooterActionListProps> = (props) => (
  <div data-tour="scheme-footer-actions" className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
    {buildSchemeViewerFooterActionItems(props)
      .filter(item => item.visible)
      .map(({ key, visible: _visible, ...buttonProps }) => (
        <SchemeViewerFooterActionButton key={key} {...buttonProps} />
      ))}
  </div>
);
