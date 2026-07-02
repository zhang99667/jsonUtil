import React from 'react';
import type { StatusBarBadgeState } from '../utils/statusBarState';
import type { StatusBarSourceValidationAction } from '../utils/statusBarSourceValidationActionTypes';

interface StatusBarSourceValidationBadgeProps {
  status: StatusBarBadgeState;
  action: StatusBarSourceValidationAction;
}

const BASE_CLASS_NAME = 'shrink-0 px-1.5 py-0.5 rounded font-bold leading-none';
const BUTTON_CLASS_NAME = `${BASE_CLASS_NAME} transition-colors hover:ring-1 hover:ring-white/70 focus:outline-none focus-visible:ring-1 focus-visible:ring-white`;

export const StatusBarSourceValidationBadge: React.FC<StatusBarSourceValidationBadgeProps> = ({
  status,
  action,
}) => {
  if (action) {
    const titleSuffix = action.type === 'locate' ? '点击定位' : '点击打开 Scheme 面板';

    return (
      <button
        data-tour="source-validation-status"
        type="button"
        aria-live="polite"
        onClick={action.onClick}
        className={`${BUTTON_CLASS_NAME} ${status.className}`}
        title={`${status.title}，${titleSuffix}`}
      >
        {status.label}
      </button>
    );
  }

  return (
    <span
      data-tour="source-validation-status"
      aria-live="polite"
      className={`${BASE_CLASS_NAME} ${status.className}`}
      title={status.title}
    >
      {status.label}
    </span>
  );
};
