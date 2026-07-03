import React from 'react';
import { TransformMode } from '../types';
import { STATUS_BAR_MODE_LABELS } from '../utils/statusBarState';

interface StatusBarModeBadgeProps {
  mode: TransformMode;
}

export const StatusBarModeBadge: React.FC<StatusBarModeBadgeProps> = ({ mode }) => (
  <>
    <span className="bg-white text-brand-primary px-1.5 py-0.5 rounded font-bold text-[11px] shadow-sm leading-none">
      {STATUS_BAR_MODE_LABELS[mode]}
    </span>
    {mode === TransformMode.DEEP_FORMAT && (
      <span className="opacity-70 text-[10px] ml-1">
        · 自动展开多层嵌套的 JSON 字符串
      </span>
    )}
  </>
);
