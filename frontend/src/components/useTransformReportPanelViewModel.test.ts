import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransformContext } from '../types';
import {
  buildTransformContextReport,
  buildTransformReportView,
} from '../utils/transformSummary';
import { buildTransformReportPanelDerivedModel } from '../utils/transformReportPanelDerivedModel';
import { useTransformReportPanelViewModel } from './useTransformReportPanelViewModel';

const fixtures = vi.hoisted(() => ({
  query: 'CMD',
  report: { kind: 'report' },
  reportView: { kind: 'filtered-view' },
  fullReportView: { kind: 'full-view' },
  derivedModel: {
    hasReportView: true,
    hasPathValueCopyItems: true,
    hasCmdStructureCopyItems: false,
    hasFocusedCmdStructureCopyItems: false,
    issueSampleCopyText: '',
    issueSampleJsonCopyText: '',
    redactedIssueSampleJsonCopyText: '',
    issueRegressionTemplateCopyText: '',
    placeholderFillTemplateSummary: null,
    placeholderFillTemplateJsonText: '',
    qualitySnapshot: null,
    qualityBaselineDeltaText: '',
    copyTitles: {},
    getPanelPlaceholderFillTemplateTitle: (title: string) => title,
  },
}));

const reactMocks = vi.hoisted(() => ({
  setQuery: vi.fn(),
  setCmdComparisonState: vi.fn(),
  setQualityBaseline: vi.fn(),
  useDeferredValue: vi.fn(),
  useEffect: vi.fn(),
  useMemo: vi.fn(),
  useState: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useDeferredValue: reactMocks.useDeferredValue,
  useEffect: reactMocks.useEffect,
  useMemo: reactMocks.useMemo,
  useState: reactMocks.useState,
}));

vi.mock('../utils/transformSummary', () => ({
  buildTransformContextReport: vi.fn(() => fixtures.report),
  buildTransformReportView: vi.fn((_: unknown, query: string) => (
    query ? fixtures.reportView : fixtures.fullReportView
  )),
}));

vi.mock('../utils/transformReportPanelDerivedModel', () => ({
  buildTransformReportPanelDerivedModel: vi.fn(() => fixtures.derivedModel),
}));

const createContext = (timestamp = 123): TransformContext => ({
  timestamp,
} as unknown as TransformContext);

describe('useTransformReportPanelViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useDeferredValue.mockImplementation((value: string) => `${value}-deferred`);
    reactMocks.useEffect.mockImplementation((effect: () => unknown) => effect());
    reactMocks.useMemo.mockImplementation((factory: () => unknown) => factory());
    reactMocks.useState.mockImplementation((initialValue: unknown) => {
      if (initialValue === '') return [fixtures.query, reactMocks.setQuery];
      if (typeof initialValue === 'function') return [initialValue(), reactMocks.setCmdComparisonState];
      return [null, reactMocks.setQualityBaseline];
    });
  });

  it('打开时构建过滤视图、完整视图和派生模型', () => {
    const context = createContext();
    const result = useTransformReportPanelViewModel({ isOpen: true, context });

    expect(buildTransformContextReport).toHaveBeenCalledWith(context);
    expect(buildTransformReportView).toHaveBeenNthCalledWith(1, fixtures.report, 'CMD-deferred');
    expect(buildTransformReportView).toHaveBeenNthCalledWith(2, fixtures.report, '');
    expect(buildTransformReportPanelDerivedModel).toHaveBeenCalledWith({
      report: fixtures.report,
      reportView: fixtures.reportView,
      fullReportView: fixtures.fullReportView,
      deferredQuery: 'CMD-deferred',
      isFilterPending: true,
      qualityBaseline: null,
      hasActiveContext: true,
    });
    expect(reactMocks.useMemo).toHaveBeenLastCalledWith(expect.any(Function), [
      'CMD-deferred',
      fixtures.fullReportView,
      true,
      true,
      null,
      fixtures.report,
      fixtures.reportView,
    ]);
    expect(result.activeContext).toBe(context);
    expect(result.reportView).toBe(fixtures.reportView);
    expect(result.fullReportView).toBe(fixtures.fullReportView);
    expect(result.hasPathValueCopyItems).toBe(true);
  });

  it('关闭时跳过报告构建，并用空上下文重置筛选状态', () => {
    const result = useTransformReportPanelViewModel({ isOpen: false, context: createContext() });

    expect(buildTransformContextReport).not.toHaveBeenCalled();
    expect(buildTransformReportView).not.toHaveBeenCalled();
    expect(buildTransformReportPanelDerivedModel).toHaveBeenCalledWith(expect.objectContaining({
      report: null,
      reportView: null,
      fullReportView: null,
      hasActiveContext: false,
    }));
    expect(reactMocks.useEffect).toHaveBeenCalledWith(expect.any(Function), [null]);
    expect(reactMocks.setQuery).toHaveBeenCalledWith('');
    expect(reactMocks.setCmdComparisonState).toHaveBeenCalledWith({
      actualCandidate: null,
      expectedText: '',
      ignoreExtraPaths: false,
      recordPath: null,
    });
    expect(result.report).toBeNull();
  });

  it('用上下文对象身份作为重置依赖，避免同时间戳报告串用筛选状态', () => {
    const firstContext = createContext(123);
    const nextContext = createContext(123);

    useTransformReportPanelViewModel({ isOpen: true, context: firstContext });
    useTransformReportPanelViewModel({ isOpen: true, context: nextContext });

    expect(firstContext).not.toBe(nextContext);
    expect(reactMocks.useEffect).toHaveBeenNthCalledWith(1, expect.any(Function), [firstContext]);
    expect(reactMocks.useEffect).toHaveBeenNthCalledWith(2, expect.any(Function), [nextContext]);
  });
});
