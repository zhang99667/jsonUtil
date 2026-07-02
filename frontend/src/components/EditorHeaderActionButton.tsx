import React from 'react';

export type EditorHeaderActionIconId = 'copy' | 'paste' | 'trash' | 'report' | 'applyToSource';

interface EditorHeaderActionButtonProps {
  dataTour: string;
  ariaLabel: string;
  title: string;
  label: string;
  className: string;
  onClick: () => void;
  ariaPressed?: boolean;
  disabled?: boolean;
  iconId?: EditorHeaderActionIconId;
  leadingAdornment?: React.ReactNode;
}

const iconClassName = 'w-3 h-3';

const headerActionIconPaths: Record<EditorHeaderActionIconId, string> = {
  copy: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
  paste: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m-4 0a2 2 0 104 0m-4 0a2 2 0 114 0m-2 7v6m0 0l-2-2m2 2l2-2',
  trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-8 0h10',
  report: 'M9 17v-6m4 6V7m4 10v-4M5 19h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  applyToSource: 'M11 17l-5-5m0 0l5-5m-5 5h12',
};

const EditorHeaderActionIcon: React.FC<{ iconId: EditorHeaderActionIconId }> = ({ iconId }) => (
  <svg className={iconClassName} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={headerActionIconPaths[iconId]} />
  </svg>
);

export const EditorHeaderActionButton: React.FC<EditorHeaderActionButtonProps> = ({
  dataTour,
  ariaLabel,
  title,
  label,
  className,
  onClick,
  ariaPressed,
  disabled,
  iconId,
  leadingAdornment,
}) => (
  <button
    data-tour={dataTour}
    aria-label={ariaLabel}
    aria-pressed={ariaPressed}
    onClick={onClick}
    disabled={disabled}
    className={className}
    title={title}
  >
    {iconId && <EditorHeaderActionIcon iconId={iconId} />}
    {leadingAdornment}
    <span className="editor-header-action-label">{label}</span>
  </button>
);
