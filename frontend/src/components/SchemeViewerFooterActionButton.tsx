import React from 'react';

type SchemeViewerFooterActionTone = 'neutral' | 'primary' | 'success' | 'warning';

interface SchemeViewerFooterActionButtonProps {
  dataTour: string;
  label: string;
  title: string;
  ariaLabel: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ariaPressed?: boolean;
  tone?: SchemeViewerFooterActionTone;
}

const buttonToneClassNames: Record<SchemeViewerFooterActionTone, string> = {
  neutral: 'bg-editor-active text-gray-200 hover:bg-editor-border',
  primary: 'bg-brand-primary text-white hover:bg-brand-primary/90',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  warning: 'bg-amber-700/80 text-white hover:bg-amber-700',
};

export const SchemeViewerFooterActionButton: React.FC<SchemeViewerFooterActionButtonProps> = ({
  dataTour,
  label,
  title,
  ariaLabel,
  icon,
  onClick,
  disabled = false,
  ariaPressed,
  tone = 'neutral',
}) => (
  <button
    type="button"
    data-tour={dataTour}
    onClick={onClick}
    disabled={disabled}
    aria-pressed={ariaPressed}
    aria-label={ariaLabel}
    className={`shrink-0 whitespace-nowrap px-2.5 py-1 text-sm rounded transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${buttonToneClassNames[tone]}`}
    title={title}
  >
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {icon}
    </svg>
    {label}
  </button>
);
