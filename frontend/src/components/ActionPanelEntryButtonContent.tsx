import React from 'react';
import type { ActionPanelEntryButtonBadge } from '../utils/actionPanelEntryButtonTypes';
import { ActionPanelButtonBadge } from './ActionPanelButtonBadge';

interface ActionPanelEntryButtonContentProps {
  label: string;
  badge?: ActionPanelEntryButtonBadge;
}

export const ActionPanelEntryButtonContent: React.FC<ActionPanelEntryButtonContentProps> = ({
  label,
  badge,
}) => (
  <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
    <span className="truncate">{label}</span>
    {badge && (
      <ActionPanelButtonBadge
        label={badge.label}
        dataTour={badge.dataTour}
        ariaHidden={badge.ariaHidden}
      />
    )}
  </span>
);
