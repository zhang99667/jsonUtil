import type { Dispatch, SetStateAction } from 'react';
import { vi } from 'vitest';
import type { TransformReportPanelCopyWorkflow } from '../utils/transformReportPanelCopyWorkflow';
import {
  createInitialTransformReportCmdComparisonState,
  type TransformReportCmdComparisonState,
} from '../utils/transformReportCmdComparisonController';
import type { TransformReportRecord } from '../utils/transformSummary';
import { buildTransformReportRecordSectionBindings } from './transformReportRecordSectionBindings';

export const record = { path: '$.cmd' } as TransformReportRecord;

export const buildCopyWorkflow = (): TransformReportPanelCopyWorkflow => ({
  copyPath: vi.fn(),
  copyOriginalValue: vi.fn(),
  copyDecodedPathValue: vi.fn(),
  copyCmdStructure: vi.fn(),
  copyCmdComparisonPackage: vi.fn(),
  copyCmdComparisonDiff: vi.fn(),
} as unknown as TransformReportPanelCopyWorkflow);

const createStateSpy = <T>(initialState: T) => {
  let state = initialState;
  const setState = vi.fn((nextState: SetStateAction<T>) => {
    state = typeof nextState === 'function'
      ? (nextState as (currentState: T) => T)(state)
      : nextState;
  });

  return {
    getState: () => state,
    setState: setState as Dispatch<SetStateAction<T>>,
  };
};

export const buildBindings = (
  overrides: Partial<Parameters<typeof buildTransformReportRecordSectionBindings>[0]> = {}
) => {
  const cmdComparisonState = overrides.cmdComparisonState ||
    createInitialTransformReportCmdComparisonState();
  const cmdStateSpy = createStateSpy<TransformReportCmdComparisonState>(cmdComparisonState);
  const queryStateSpy = createStateSpy('');
  const getCandidateRecords = vi.fn(() => [record]);

  return {
    cmdStateSpy,
    queryStateSpy,
    getCandidateRecords,
    bindings: buildTransformReportRecordSectionBindings({
      copyWorkflow: buildCopyWorkflow(),
      cmdComparisonState,
      setCmdComparisonState: cmdStateSpy.setState,
      setQuery: queryStateSpy.setState,
      firstCmdStructureRecord: record,
      getCandidateRecords,
      ...overrides,
    }),
  };
};
