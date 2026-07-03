import { describe, expect, it, vi } from 'vitest';
import type { TransformReportCmdComparisonState } from './transformReportCmdComparisonController';
import type { TransformReportPanelCopyWorkflowEffects, TransformReportPanelCopyWorkflowState } from './transformReportPanelCopyWorkflow';
import { buildTransformReportPanelCopyWorkflowModel } from './transformReportPanelCopyWorkflowModel';
import type { TransformContextReport, TransformReportRecord, TransformReportView } from './transformSummary';

type ModelEffects = Omit<
  TransformReportPanelCopyWorkflowEffects,
  'buildActiveCmdComparisonReportText' | 'buildActiveCmdComparisonCandidateText'
>;

const workflowMock = vi.hoisted(() => ({
  workflow: { copyReport: vi.fn(async () => undefined) },
  build: vi.fn(),
}));

vi.mock('./transformReportPanelCopyWorkflow', () => ({
  buildTransformReportPanelCopyWorkflow: workflowMock.build,
}));

const CMD_SCHEMA = 'baiduboxapp://v1/open';
const createCmdJson = (id: number): string => JSON.stringify({
  result: { cmdSchema: CMD_SCHEMA, source: CMD_SCHEMA, cmdParams: { id } },
});
const createCmdRecord = (path: string, id: number, hasCmdStructure = true): TransformReportRecord => ({
  path,
  sourceLabel: 'scheme',
  commandSchema: CMD_SCHEMA,
  hasCmdStructure,
  cmdStructureCopyText: createCmdJson(id),
} as TransformReportRecord);
const createReportView = (records: TransformReportRecord[]): TransformReportView => ({
  records,
  cmdStructureRecords: records.filter(record => record.hasCmdStructure),
} as TransformReportView);

const currentRecord = createCmdRecord('$.current', 1);
const betterRecord = createCmdRecord('$.better', 2);
const plainRecord = createCmdRecord('$.plain', 3, false);
const report = { records: [plainRecord, currentRecord, betterRecord] } as TransformContextReport;
const reportView = createReportView([currentRecord]);
const fullReportView = createReportView([currentRecord, betterRecord]);
const expectedText = createCmdJson(2);

const buildCopyWorkflowState = (overrides: Partial<TransformReportPanelCopyWorkflowState> = {}): TransformReportPanelCopyWorkflowState => ({
  activeContext: null,
  report,
  reportView,
  deferredQuery: 'CMD',
  isFilterPending: false,
  qualitySnapshot: null,
  qualityBaselineDeltaText: '',
  placeholderFillTemplateJsonText: '',
  issueSampleCopyText: '',
  issueSampleJsonCopyText: '',
  redactedIssueSampleJsonCopyText: '',
  issueRegressionTemplateCopyText: '',
  hasPathValueCopyItems: true,
  hasCmdStructureCopyItems: true,
  hasFocusedCmdStructureCopyItems: true,
  cmdComparisonExpectedText: expectedText,
  cmdComparisonIgnoreExtraPaths: false,
  cmdComparisonActualCandidate: null,
  ...overrides,
});

const buildCmdComparisonState = (overrides: Partial<TransformReportCmdComparisonState> = {}): TransformReportCmdComparisonState => ({
  recordPath: '$.current',
  expectedText,
  ignoreExtraPaths: false,
  actualCandidate: null,
  ...overrides,
});

const buildEffects = (): ModelEffects => ({
  copyText: vi.fn(async () => undefined),
  showSuccess: vi.fn(),
  showError: vi.fn(),
  setQualityBaseline: vi.fn(),
  showStatusSuccess: vi.fn(),
  openTemplateFill: vi.fn(),
});

const buildModel = ({
  copyWorkflowState = {},
  cmdComparisonState = {},
  view = fullReportView,
  effects = buildEffects(),
}: {
  copyWorkflowState?: Partial<TransformReportPanelCopyWorkflowState>;
  cmdComparisonState?: Partial<TransformReportCmdComparisonState>;
  view?: TransformReportView | null;
  effects?: ModelEffects;
} = {}) => {
  const state = buildCopyWorkflowState(copyWorkflowState);
  workflowMock.build.mockReturnValueOnce(workflowMock.workflow);
  const model = buildTransformReportPanelCopyWorkflowModel({
    copyWorkflowState: state,
    cmdComparisonState: buildCmdComparisonState(cmdComparisonState),
    fullReportView: view,
    effects,
  });
  const [, capturedEffects] = workflowMock.build.mock.calls.at(-1) as [
    TransformReportPanelCopyWorkflowState,
    TransformReportPanelCopyWorkflowEffects,
  ];
  return { model, state, effects, capturedEffects };
};

describe('buildTransformReportPanelCopyWorkflowModel', () => {
  it('装配 copy workflow、active CMD 文本和候选记录 getter', () => {
    const { model, state, effects, capturedEffects } = buildModel();

    expect(model.copyWorkflow).toBe(workflowMock.workflow);
    expect(workflowMock.build).toHaveBeenCalledWith(state, expect.objectContaining(effects));
    expect(capturedEffects.buildActiveCmdComparisonReportText()).toContain('CMD 结构差异报告');
    expect(capturedEffects.buildActiveCmdComparisonCandidateText()).toContain('建议优先切到 $.better');
    expect(model.getCmdComparisonCandidateRecords()).toEqual([currentRecord, betterRecord]);

    const fallback = buildModel({
      copyWorkflowState: { report: null, reportView: createReportView([]) },
      cmdComparisonState: { recordPath: '$.better' },
    });
    expect(fallback.capturedEffects.buildActiveCmdComparisonReportText()).toContain('CMD 结构差异报告');
    expect(fallback.model.getCmdComparisonCandidateRecords()).toEqual([currentRecord, betterRecord]);
  });
});
