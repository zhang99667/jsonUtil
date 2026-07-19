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
    className="rounded bg-blue-950/90 px-1.5 py-0.5 text-[10px] font-bold leading-none text-blue-100"
  >
    {label}
  </span>
);
