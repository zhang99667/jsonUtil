import { describe, expect, it } from 'vitest';
import { assertElementLike, collectText } from './componentElementTestHelpers';
import { JsonPathPanelResultToolbarStatus } from './JsonPathPanelResultToolbarStatus';

const renderStatus = (
  overrides: Partial<Parameters<typeof JsonPathPanelResultToolbarStatus>[0]> = {}
) => JsonPathPanelResultToolbarStatus({
  currentResultIndex: 1,
  resultCount: 3,
  isResultLimited: false,
  resultLimit: 500,
  resultStatusId: 'jsonpath-result-status',
  ...overrides,
});

describe('JsonPathPanelResultToolbarStatus', () => {
  it('渲染当前结果位置和无障碍状态属性', () => {
    const status = assertElementLike(renderStatus());

    expect(status.props).toMatchObject({
      id: 'jsonpath-result-status',
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': 'true',
    });
    expect(collectText(status)).toContain('2 / 3');
    expect(collectText(status)).not.toContain('命中超过');
  });

  it('命中超过上限时渲染提前停止提示', () => {
    const status = renderStatus({ isResultLimited: true, resultLimit: 2 });

    expect(collectText(status)).toContain('命中超过 2，已提前停止');
  });
});
