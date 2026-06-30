import React from 'react';
import type { ActionPanelToolIconId } from '../utils/actionPanelToolGroups';

interface ActionPanelToolIconProps {
  iconId: ActionPanelToolIconId;
}

export const ActionPanelToolIcon: React.FC<ActionPanelToolIconProps> = ({ iconId }) => {
  switch (iconId) {
    case 'escape':
      return <span className="font-mono font-bold text-sm">\n</span>;
    case 'quote':
      return <span className="font-mono font-bold text-sm">"</span>;
    case 'unicode':
      return <span className="font-mono font-bold text-sm">\u</span>;
    case 'chinese':
      return <span className="font-mono font-bold text-sm">cn</span>;
    case 'percent':
      return <span className="font-mono font-bold text-sm">%</span>;
    case 'url':
      return <span className="font-mono font-bold text-sm">Ur</span>;
    case 'base64':
      return <span className="font-mono font-bold text-sm">B64</span>;
    case 'base64-short':
      return <span className="font-mono font-bold text-sm">64</span>;
    case 'typescript':
      return <span className="font-mono font-bold text-sm">TS</span>;
    case 'document':
      return (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'format':
      return (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      );
    case 'flask':
      return (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      );
    case 'bolt':
      return (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'sort':
      return (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
      );
    default:
      return null;
  }
};
