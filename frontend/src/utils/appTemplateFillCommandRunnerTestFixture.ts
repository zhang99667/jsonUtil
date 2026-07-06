import { vi } from 'vitest';
import { runAppTemplateFillCommand } from './appTemplateFillCommandRunner';
import { createAppTemplateFillCommandEffects } from './appTemplateFillCommandEffectsFixture';

export {
  createAppTemplateFillCommandEffects,
  type AppTemplateFillCommandEffectsFixture,
} from './appTemplateFillCommandEffectsFixture';

const mocks = vi.hoisted(() => ({
  dispatchChunkLoadRecoveryEvent: vi.fn(() => false),
  applyTemplate: vi.fn(() => '{"merged":true}'),
  isPlaceholderFillTemplateJson: vi.fn(() => false),
  buildAppTemplateFillQualityDelta: vi.fn((_input: unknown) => '质量变化: +1'),
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
  tryBuildAppTemplateFillQualityDelta: (input: unknown) => {
    try {
      return mocks.buildAppTemplateFillQualityDelta(input);
    } catch {
      return '';
    }
  },
}));

export const getAppTemplateFillCommandRunnerMocks = () => mocks;

export const resetAppTemplateFillCommandRunnerMocks = () => {
  vi.clearAllMocks();
  mocks.applyTemplate.mockReturnValue('{"merged":true}');
  mocks.buildAppTemplateFillQualityDelta.mockReturnValue('质量变化: +1');
  mocks.isPlaceholderFillTemplateJson.mockReturnValue(false);
  mocks.dispatchChunkLoadRecoveryEvent.mockReturnValue(false);
};

export const runTemplateFillCommand = (
  effects = createAppTemplateFillCommandEffects(),
  templateJson = '{"b":2}'
) => runAppTemplateFillCommand(
  { sourceBeforeApply: '{"a":1}', templateJson, autoExpandScheme: true },
  effects
);

export const runPlaceholderTemplateFillCommand = (effects = createAppTemplateFillCommandEffects()) => {
  mocks.isPlaceholderFillTemplateJson.mockReturnValue(true);
  return runTemplateFillCommand(effects, '{"kind":"json-helper-runtime-placeholder-fill-template"}');
};
