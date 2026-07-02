import React from 'react';

export type TransformReportActionButtonTone = 'copy' | 'locate' | 'scheme' | 'compare';

const actionButtonClassNames: Record<TransformReportActionButtonTone, string> = {
  copy: 'text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors',
  locate: 'text-gray-400 hover:text-emerald-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors',
  scheme: 'text-gray-400 hover:text-violet-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors',
  compare: 'text-gray-400 hover:text-teal-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors',
};

interface TransformReportActionButtonProps {
  children: React.ReactNode;
  'data-tour': string;
  className?: string;
  title?: string;
  tone?: TransformReportActionButtonTone;
  onClick: () => void;
}

export const getTransformReportActionButtonClassName = (
  tone: TransformReportActionButtonTone = 'copy'
): string => actionButtonClassNames[tone];

export const TransformReportActionButton: React.FC<TransformReportActionButtonProps> = ({
  children,
  className,
  title,
  tone,
  onClick,
  'data-tour': dataTour,
}) => (
  <button
    type="button"
    data-tour={dataTour}
    onClick={onClick}
    className={className || getTransformReportActionButtonClassName(tone)}
    title={title}
  >
    {children}
  </button>
);
