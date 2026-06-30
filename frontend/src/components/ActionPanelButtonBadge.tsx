import React from 'react';

interface ActionPanelButtonBadgeProps {
  label: string;
  dataTour: string;
  ariaHidden?: boolean;
}

export const ActionPanelButtonBadge: React.FC<ActionPanelButtonBadgeProps> = ({
  label,
  dataTour,
  ariaHidden,
}) => (
  <span
    aria-hidden={ariaHidden}
    data-tour={dataTour}
    className="rounded bg-brand-primary/20 px-1.5 py-0.5 text-[10px] font-bold leading-none text-brand-primary"
  >
    {label}
  </span>
);
