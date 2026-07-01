import React from 'react';
import type { ActionPanelEntryButtonBadge } from '../utils/actionPanelEntryButtonTypes';

export const ActionPanelButtonBadge: React.FC<ActionPanelEntryButtonBadge> = ({
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
