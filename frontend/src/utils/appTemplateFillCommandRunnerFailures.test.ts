import { beforeEach, describe, expect, it } from 'vitest';
import {
  createAppTemplateFillCommandEffects,
  getAppTemplateFillCommandRunnerMocks,
  resetAppTemplateFillCommandRunnerMocks,
  runPlaceholderTemplateFillCommand,
  runTemplateFillCommand,
  type AppTemplateFillCommandEffectsFixture,
} from './appTemplateFillCommandRunnerTestFixture';
import {
  expectPlaceholderTemplateAppliedWithoutDelta,
  expectTemplateCommandFailure,
  expectTemplateCommandSourceUntouched,
} from './appTemplateFillCommandRunnerTestAssertions';

const mocks = getAppTemplateFillCommandRunnerMocks();
type PlaceholderFailureSetup = (effects: AppTemplateFillCommandEffectsFixture) => void;

describe('appTemplateFillCommandRunner failures', () => {
  beforeEach(() => {
    resetAppTemplateFillCommandRunnerMocks();
  });

  it('质量摘要模块 chunk 失效时交给统一刷新恢复', async () => {
    const effects = createAppTemplateFillCommandEffects();
    const error = new TypeError('Failed to fetch dynamically imported module: /assets/transformSummary-old.js');
    mocks.dispatchChunkLoadRecoveryEvent.mockReturnValue(true);
    effects.loadSummaryModule.mockRejectedValue(error);

    await runPlaceholderTemplateFillCommand(effects);

    expect(mocks.dispatchChunkLoadRecoveryEvent).toHaveBeenCalledWith(error);
    expect(effects.onSetTemplateApplyQualityDelta).not.toHaveBeenCalled();
    expect(effects.onShowError).not.toHaveBeenCalled();
  });

  it.each<[string, PlaceholderFailureSetup]>([
    ['质量摘要模块加载失败时仍应用占位符模板', effects => {
      effects.loadSummaryModule.mockRejectedValue(new Error('summary failed'));
    }],
    ['质量 delta 构建失败时仍应用占位符模板', () => {
      mocks.buildAppTemplateFillQualityDelta.mockImplementation(() => {
        throw new Error('quality failed');
      });
    }],
  ])('%s', async (_, setupFailure) => {
    const effects = createAppTemplateFillCommandEffects();
    setupFailure(effects);

    await runPlaceholderTemplateFillCommand(effects);

    expectPlaceholderTemplateAppliedWithoutDelta(effects);
  });

  it.each([
    ['模板应用失败时保留原始错误文案', new Error('当前编辑器内容为空'), '当前编辑器内容为空', false],
    ['空白 Error 异常使用失败兜底文案', new Error('   '), '模板应用失败', true],
    ['非 Error 异常使用失败兜底文案且不写回 SOURCE', 'blocked', '模板应用失败', true],
  ])('%s', async (_, thrownError, message, shouldKeepSourceUntouched) => {
    mocks.applyTemplate.mockImplementation(() => {
      throw thrownError;
    });
    const effects = createAppTemplateFillCommandEffects();

    await runTemplateFillCommand(effects);

    expectTemplateCommandFailure(effects, message);
    if (shouldKeepSourceUntouched) expectTemplateCommandSourceUntouched(effects);
  });
});
