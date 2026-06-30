import { ActionType } from '../types';

export interface ActionPanelFileOperationItem {
  action: ActionType.OPEN | ActionType.SAVE;
  label: string;
  dataTour: string;
}

export const actionPanelFileOperationItems: ActionPanelFileOperationItem[] = [
  {
    action: ActionType.OPEN,
    label: '打开文件',
    dataTour: 'open-file-button',
  },
  {
    action: ActionType.SAVE,
    label: '保存为 JSON',
    dataTour: 'save-file-button',
  },
];
