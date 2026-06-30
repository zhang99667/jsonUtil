import React from 'react';
import { TransformMode } from '../types';
import { ACTION_PANEL_TOOL_GROUPS } from '../utils/actionPanelToolGroups';
import { ActionPanelSectionTitle } from './ActionPanelSectionTitle';
import { ActionPanelToolButton } from './ActionPanelToolButton';
import { ActionPanelToolIcon } from './ActionPanelToolIcon';

interface ActionPanelToolGroupsProps {
  activeMode: TransformMode;
  isCollapsed: boolean;
  onModeChange: (mode: TransformMode) => void;
}

export const ActionPanelToolGroups: React.FC<ActionPanelToolGroupsProps> = ({
  activeMode,
  isCollapsed,
  onModeChange,
}) => (
  <>
    {ACTION_PANEL_TOOL_GROUPS.map((group, index) => (
      <React.Fragment key={group.id}>
        <ActionPanelSectionTitle
          title={group.title}
          isCollapsed={isCollapsed}
          isFirst={index === 0}
        />
        <div className="mb-4">
          {group.items.map(item => (
            <ActionPanelToolButton
              key={item.mode}
              mode={item.mode}
              label={item.label}
              icon={<ActionPanelToolIcon iconId={item.iconId} />}
              colorClass={item.colorClass}
              dataTour={item.dataTour}
              isActive={activeMode === item.mode}
              isCollapsed={isCollapsed}
              onClick={onModeChange}
            />
          ))}
        </div>
      </React.Fragment>
    ))}
  </>
);
