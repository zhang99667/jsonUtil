import { describe, expect, it, vi } from 'vitest';
import { findByType } from './componentElementTestHelpers';
import { JsonPathPanelResultToolbar } from './JsonPathPanelResultToolbar';
import { JsonPathPanelResultToolbarActionList } from './JsonPathPanelResultToolbarActionList';
import { JsonPathPanelResultToolbarStatus } from './JsonPathPanelResultToolbarStatus';

const renderToolbar = (
  overrides: Partial<Parameters<typeof JsonPathPanelResultToolbar>[0]> = {}
) => JsonPathPanelResultToolbar({
  currentResultIndex: 1,
  resultCount: 3,
  isResultLimited: false,
  resultLimit: 500,
  isQuerying: false,
  canCopyValues: true,
  canCopyPathValues: true,
  copyButtonLabel: '复制值',
  copyPathValueButtonLabel: '复制路径和值',
  resultStatusId: 'jsonpath-result-status',
  onCopyValues: vi.fn(),
  onCopyPathValues: vi.fn(),
  onPrevious: vi.fn(),
  onNext: vi.fn(),
  ...overrides,
});

describe('JsonPathPanelResultToolbar', () => {
  it('无结果时不渲染工具条', () => {
    expect(renderToolbar({ resultCount: 0 })).toBeNull();
  });

  it('透传结果状态和工具按钮参数', () => {
    const callbacks = {
      onCopyValues: vi.fn(),
      onCopyPathValues: vi.fn(),
      onPrevious: vi.fn(),
      onNext: vi.fn(),
    };
    const tree = renderToolbar({ isResultLimited: true, resultLimit: 2, ...callbacks });
    const status = findByType(tree, JsonPathPanelResultToolbarStatus)[0];
    const actionList = findByType(tree, JsonPathPanelResultToolbarActionList)[0];

    expect(status.props).toMatchObject({
      currentResultIndex: 1,
      resultCount: 3,
      isResultLimited: true,
      resultLimit: 2,
      resultStatusId: 'jsonpath-result-status',
    });
    expect(actionList.props).toMatchObject({
      isQuerying: false,
      canCopyValues: true,
      canCopyPathValues: true,
      copyButtonLabel: '复制值',
      copyPathValueButtonLabel: '复制路径和值',
      ...callbacks,
    });
  });
});
