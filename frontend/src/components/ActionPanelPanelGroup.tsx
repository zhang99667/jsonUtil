import React from 'react';
import {
  ACTION_PANEL_PANEL_GROUP,
  type ActionPanelPanelItemId,
} from '../utils/actionPanelPanelItems';
import { ActionPanelPanelButton } from './ActionPanelPanelButton';
import { ActionPanelPanelIcon } from './ActionPanelPanelIcon';
import { ActionPanelSectionTitle } from './ActionPanelSectionTitle';

export type ActionPanelPanelStateById = Record<ActionPanelPanelItemId, {
  isOpen: boolean;
  onClick: () => void;
}>;

interface ActionPanelPanelGroupProps {
  isCollapsed: boolean;
  panelStateById: ActionPanelPanelStateById;
}

export const ActionPanelPanelGroup: React.FC<ActionPanelPanelGroupProps> = ({
  isCollapsed,
  panelStateById,
}) => (
  <>
    <ActionPanelSectionTitle
      title={ACTION_PANEL_PANEL_GROUP.title}
      isCollapsed={isCollapsed}
    />
    <div className="mb-4">
      {ACTION_PANEL_PANEL_GROUP.items.map(item => {
        const panelState = panelStateById[item.id];

        return (
          <ActionPanelPanelButton
            key={item.id}
            label={item.label}
            icon={<ActionPanelPanelIcon iconId={item.iconId} />}
            iconClass={item.iconClass}
            hoverIconClass={item.hoverIconClass}
            isOpen={panelState.isOpen}
            isCollapsed={isCollapsed}
            onClick={panelState.onClick}
            dataTour={item.dataTour}
          />
        );
      })}
    </div>
  </>
);
