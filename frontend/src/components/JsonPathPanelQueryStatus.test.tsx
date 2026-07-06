import { describe, expect, it } from 'vitest';
import { collectText, findByTour, findByTourOrNull } from './componentElementTestHelpers';
import { JsonPathPanelQueryStatus } from './JsonPathPanelQueryStatus';

const renderStatus = (
    overrides: Partial<Parameters<typeof JsonPathPanelQueryStatus>[0]> = {}
) => JsonPathPanelQueryStatus({
    isQuerying: false,
    showCancelledQuery: false,
    ...overrides,
});

describe('JsonPathPanelQueryStatus', () => {
    it('空闲时不渲染状态提示', () => {
        expect(findByTourOrNull(renderStatus(), 'jsonpath-query-status')).toBeNull();
    });

    it('查询中时展示实时状态', () => {
        const status = findByTour(renderStatus({ isQuerying: true }), 'jsonpath-query-status')[0];

        expect(status.props.role).toBe('status');
        expect(status.props['aria-live']).toBe('polite');
        expect(collectText(status)).toBe('查询中...');
    });

    it('取消查询后展示已取消状态，查询中优先级更高', () => {
        expect(collectText(renderStatus({ showCancelledQuery: true }))).toBe('已取消查询');
        expect(collectText(renderStatus({ isQuerying: true, showCancelledQuery: true }))).toBe('查询中...');
    });
});
