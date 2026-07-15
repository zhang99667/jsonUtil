import { describe, expect, it } from 'vitest';
import type { TransformReportRecord } from './transformSummary';
import type { RankedCmdComparisonCandidate } from './transformReportCmdComparison';
import {
  buildOpenFirstTransformReportCmdComparisonPlan,
  createInitialTransformReportCmdComparisonState,
  resetTransformReportCmdComparisonState,
  switchTransformReportCmdComparisonCandidate,
  toggleTransformReportCmdComparisonRecord,
  updateTransformReportCmdComparisonExpectedText,
  updateTransformReportCmdComparisonIgnoreExtraPaths,
  type TransformReportCmdComparisonState,
} from './transformReportCmdComparisonController';

const record = (path: string): TransformReportRecord => ({ path } as TransformReportRecord);

const stateWithOpenRecord = (overrides: Partial<TransformReportCmdComparisonState> = {}) => ({
  recordPath: '$.current',
  expectedText: '{"result":{}}',
  ignoreExtraPaths: true,
  actualCandidate: {
    id: '$.candidate',
    recordPath: '$.candidate',
    label: '$.candidate',
    sourceLabel: 'SOURCE[1]',
    actual: { result: { cmdSchema: 'sampleapp://v1/open', cmdParams: {} } },
  },
  ...overrides,
}) satisfies TransformReportCmdComparisonState;

const candidate = (
  overrides: Partial<RankedCmdComparisonCandidate> = {}
): RankedCmdComparisonCandidate => ({
  id: '$.candidate',
  recordPath: '$.target',
  label: '$.target',
  score: 1,
  sourceLabel: 'SOURCE[2]',
  actual: { result: { cmdSchema: 'sampleapp://v1/open', cmdParams: { id: 1 } } },
  ...overrides,
} as RankedCmdComparisonCandidate);

describe('transformReportCmdComparisonController', () => {
  it('初始化和上下文重置会清空对比状态并关闭忽略额外路径', () => {
    expect(createInitialTransformReportCmdComparisonState()).toEqual({
      recordPath: null,
      expectedText: '',
      ignoreExtraPaths: false,
      actualCandidate: null,
    });
    expect(resetTransformReportCmdComparisonState()).toEqual(createInitialTransformReportCmdComparisonState());
  });

  it('toggle 当前记录时收起并清空文本和候选但保留 ignoreExtraPaths', () => {
    const nextState = toggleTransformReportCmdComparisonRecord(
      stateWithOpenRecord(),
      record('$.current')
    );

    expect(nextState).toMatchObject({
      recordPath: null,
      expectedText: '',
      ignoreExtraPaths: true,
      actualCandidate: null,
    });
  });

  it('toggle 新记录时打开新路径并保留 ignoreExtraPaths', () => {
    const nextState = toggleTransformReportCmdComparisonRecord(
      stateWithOpenRecord(),
      record('$.next')
    );

    expect(nextState).toMatchObject({
      recordPath: '$.next',
      expectedText: '',
      ignoreExtraPaths: true,
      actualCandidate: null,
    });
  });

  it('打开第一条 CMD 结构记录时产出固定筛选词并清空旧输入', () => {
    const plan = buildOpenFirstTransformReportCmdComparisonPlan(
      stateWithOpenRecord(),
      record('$.first')
    );

    expect(plan?.query).toBe('CMD结构');
    expect(plan?.state).toMatchObject({
      recordPath: '$.first',
      expectedText: '',
      ignoreExtraPaths: true,
      actualCandidate: null,
    });
    expect(buildOpenFirstTransformReportCmdComparisonPlan(stateWithOpenRecord(), null)).toBeNull();
  });

  it('切换回当前记录候选时清空 actualCandidate 并保留输入文本', () => {
    const plan = switchTransformReportCmdComparisonCandidate(
      stateWithOpenRecord(),
      candidate({ id: '$.target', recordPath: '$.target' })
    );

    expect(plan.query).toBe('$.target');
    expect(plan.state).toMatchObject({
      recordPath: '$.target',
      expectedText: '{"result":{}}',
      ignoreExtraPaths: true,
      actualCandidate: null,
    });
  });

  it('切换到替代候选时转换 actualCandidate 并保留 ignoreExtraPaths', () => {
    const plan = switchTransformReportCmdComparisonCandidate(
      stateWithOpenRecord(),
      candidate()
    );

    expect(plan.query).toBe('$.target');
    expect(plan.state.recordPath).toBe('$.target');
    expect(plan.state.ignoreExtraPaths).toBe(true);
    expect(plan.state.actualCandidate).toMatchObject({
      id: '$.candidate',
      recordPath: '$.target',
      sourceLabel: 'SOURCE[2]',
    });
  });

  it('支持独立更新 expectedText 和 ignoreExtraPaths', () => {
    const baseState = createInitialTransformReportCmdComparisonState();

    expect(updateTransformReportCmdComparisonExpectedText(baseState, 'expected').expectedText).toBe('expected');
    expect(updateTransformReportCmdComparisonIgnoreExtraPaths(baseState, true).ignoreExtraPaths).toBe(true);
  });
});
