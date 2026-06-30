import { describe, expect, it } from 'vitest';
import { ActionType } from '../types';
import { actionPanelFileOperationItems } from './actionPanelFileOperationItems';

describe('actionPanelFileOperationItems', () => {
  it('保持普通文件操作顺序和引导锚点', () => {
    expect(actionPanelFileOperationItems).toEqual([
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
    ]);
  });
});
