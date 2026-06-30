import React from 'react';
import type { ActionType } from '../types';
import { actionPanelFileOperationItems } from '../utils/actionPanelFileOperationItems';
import { ActionPanelAiFixButton } from './ActionPanelAiFixButton';
import { ActionPanelFileActionIcon } from './ActionPanelFileActionIcon';
import { ActionPanelFileActionButton } from './ActionPanelFileActionButton';

interface ActionPanelFileOperationsProps {
  isCollapsed: boolean;
  isProcessing: boolean;
  onAction: (action: ActionType) => void;
}

export const ActionPanelFileOperations: React.FC<ActionPanelFileOperationsProps> = ({
  isCollapsed,
  isProcessing,
  onAction,
}) => (
  <div data-tour="file-operations" className="pt-4 mt-2 border-t border-editor-border">
    {actionPanelFileOperationItems.map(({ action, label, dataTour }) => (
      <ActionPanelFileActionButton
        key={action}
        action={action}
        label={label}
        dataTour={dataTour}
        icon={<ActionPanelFileActionIcon action={action} />}
        isCollapsed={isCollapsed}
        onAction={onAction}
      />
    ))}

    <ActionPanelAiFixButton
      isCollapsed={isCollapsed}
      isProcessing={isProcessing}
      onAction={onAction}
    />
  </div>
);
