import { vi } from 'vitest';
import { runAppTemplateFillCommand } from './appTemplateFillCommandRunner';

const mocks = vi.hoisted(() => ({
  dispatchChunkLoadRecoveryEvent: vi.fn(() => false),
  applyTemplate: vi.fn(() => '{"merged":true}'),
  isPlaceholderFillTemplateJson: vi.fn(() => false),
  buildAppTemplateFillQualityDelta: vi.fn(() => '质量变化: +1'),
}));

vi.mock('./chunkLoadRecoveryDispatch', () => ({
  dispatchChunkLoadRecoveryEvent: mocks.dispatchChunkLoadRecoveryEvent,
}));

vi.mock('./transformations', async importOriginal => ({
  ...await importOriginal<typeof import('./transformations')>(),
  applyTemplate: mocks.applyTemplate,
}));

vi.mock('./appWorkflowHelpers', async importOriginal => ({
  ...await importOriginal<typeof import('./appWorkflowHelpers')>(),
  isPlaceholderFillTemplateJson: mocks.isPlaceholderFillTemplateJson,
}));

vi.mock('./appTemplateFillQualityDelta', () => ({
  buildAppTemplateFillQualityDelta: mocks.buildAppTemplateFillQualityDelta,
}));

const createEffectsBase = () => ({
  currentSourceText: '{"a":1}',
  getCurrentSourceText: vi.fn(function getCurrentSourceText(this: { currentSourceText: string }) {
    return this.currentSourceText;
  }),
  setCurrentSourceText: vi.fn(function setCurrentSourceText(this: { currentSourceText: string }, value: string) {
    this.currentSourceText = value;
  }),
  loadSummaryModule: vi.fn(async () => ({}) as never),
  onSetSourceText: vi.fn(),
  onUpdateActiveFileContent: vi.fn(),
  onSetTemplateApplyQualityDelta: vi.fn(),
  onShowError: vi.fn(),
  onShowSuccess: vi.fn(),
});

export type AppTemplateFillCommandEffectsFixture = ReturnType<typeof createEffectsBase>;

export const getAppTemplateFillCommandRunnerMocks = () => mocks;

export const resetAppTemplateFillCommandRunnerMocks = () => {
  vi.clearAllMocks();
  mocks.applyTemplate.mockReturnValue('{"merged":true}');
  mocks.buildAppTemplateFillQualityDelta.mockReturnValue('质量变化: +1');
  mocks.isPlaceholderFillTemplateJson.mockReturnValue(false);
  mocks.dispatchChunkLoadRecoveryEvent.mockReturnValue(false);
};

export const createAppTemplateFillCommandEffects = (
  overrides: Partial<AppTemplateFillCommandEffectsFixture> = {}
) => ({
  ...createEffectsBase(),
  ...overrides,
});

export const runTemplateFillCommand = (
  effects = createAppTemplateFillCommandEffects(),
  templateJson = '{"b":2}'
) => runAppTemplateFillCommand(
  { sourceBeforeApply: '{"a":1}', templateJson, autoExpandScheme: true },
  effects
);
