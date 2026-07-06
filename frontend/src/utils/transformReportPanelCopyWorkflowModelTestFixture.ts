import { vi } from 'vitest';
import type { TransformReportCmdComparisonState } from './transformReportCmdComparisonController';
import type { TransformReportPanelCopyWorkflowEffects, TransformReportPanelCopyWorkflowState } from './transformReportPanelCopyWorkflow';
import { buildTransformReportPanelCopyWorkflowModel } from './transformReportPanelCopyWorkflowModel';
import type { TransformContextReport, TransformReportRecord, TransformReportView } from './transformSummary';
import { createTransformReportViewWithRecords } from './transformReportViewTestFixture';

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

export const currentRecord = createCmdRecord('$.current', 1);
export const betterRecord = createCmdRecord('$.better', 2);
export const emptyReportView = createTransformReportViewWithRecords([]);

const plainRecord = createCmdRecord('$.plain', 3, false);
const expectedText = createCmdJson(2);
const report = { records: [plainRecord, currentRecord, betterRecord] } as TransformContextReport;
const reportView = createTransformReportViewWithRecords([currentRecord]);
const fullReportView = createTransformReportViewWithRecords([currentRecord, betterRecord]);

const buildCopyWorkflowState = (
  overrides: Partial<TransformReportPanelCopyWorkflowState> = {}
): TransformReportPanelCopyWorkflowState => ({
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

const buildCmdComparisonState = (
  overrides: Partial<TransformReportCmdComparisonState> = {}
): TransformReportCmdComparisonState => ({
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

export const buildModel = ({
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
  const [capturedState, capturedEffects] = workflowMock.build.mock.calls.at(-1) as [
    TransformReportPanelCopyWorkflowState,
    TransformReportPanelCopyWorkflowEffects,
  ];
  return { model, state, effects, capturedState, capturedEffects, workflow: workflowMock.workflow };
};
