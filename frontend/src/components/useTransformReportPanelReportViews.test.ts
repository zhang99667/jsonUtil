import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransformContext } from '../types';
import {
  buildTransformContextReport,
  buildTransformReportView,
} from '../utils/transformSummary';
import { useTransformReportPanelReportViews } from './useTransformReportPanelReportViews';

const fixtures = vi.hoisted(() => ({
  report: { kind: 'report' },
  reportView: { kind: 'filtered-view' },
  fullReportView: { kind: 'full-view' },
}));

const reactMocks = vi.hoisted(() => ({
  useMemo: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useMemo: reactMocks.useMemo,
}));

vi.mock('../utils/transformSummary', () => ({
  buildTransformContextReport: vi.fn(() => fixtures.report),
  buildTransformReportView: vi.fn((_: unknown, query: string) => (
    query ? fixtures.reportView : fixtures.fullReportView
  )),
}));

const createContext = (): TransformContext => ({ timestamp: 123 } as unknown as TransformContext);

describe('useTransformReportPanelReportViews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useMemo.mockImplementation((factory: () => unknown) => factory());
  });

  it('有活动上下文时构建报告、过滤视图和完整视图', () => {
    const context = createContext();
    const result = useTransformReportPanelReportViews({
      activeContext: context,
      deferredQuery: 'CMD',
    });

    expect(buildTransformContextReport).toHaveBeenCalledWith(context);
    expect(buildTransformReportView).toHaveBeenNthCalledWith(1, fixtures.report, 'CMD');
    expect(buildTransformReportView).toHaveBeenNthCalledWith(2, fixtures.report, '');
    expect(reactMocks.useMemo).toHaveBeenNthCalledWith(1, expect.any(Function), [context]);
    expect(reactMocks.useMemo).toHaveBeenNthCalledWith(2, expect.any(Function), [fixtures.report, 'CMD']);
    expect(reactMocks.useMemo).toHaveBeenNthCalledWith(3, expect.any(Function), [fixtures.report]);
    expect(result).toEqual({
      report: fixtures.report,
      reportView: fixtures.reportView,
      fullReportView: fixtures.fullReportView,
    });
  });

  it('无活动上下文时跳过报告构建', () => {
    expect(useTransformReportPanelReportViews({
      activeContext: null,
      deferredQuery: 'CMD',
    })).toEqual({
      report: null,
      reportView: null,
      fullReportView: null,
    });
    expect(buildTransformContextReport).not.toHaveBeenCalled();
    expect(buildTransformReportView).not.toHaveBeenCalled();
  });
});
