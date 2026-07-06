import { beforeEach, describe, expect, it } from 'vitest';
import {
  createAppTemplateFillCommandEffects,
  getAppTemplateFillCommandRunnerMocks,
  resetAppTemplateFillCommandRunnerMocks,
  runPlaceholderTemplateFillCommand,
  runTemplateFillCommand,
} from './appTemplateFillCommandRunnerTestFixture';
import {
  expectSourceChangedTemplateBlocked,
  expectTemplateCommandFailure,
  expectTemplateCommandSourceUntouched,
} from './appTemplateFillCommandRunnerTestAssertions';

const mocks = getAppTemplateFillCommandRunnerMocks();

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

  it('占位符回填期间 SOURCE 已变化时阻止应用模板', async () => {
    const effects = createAppTemplateFillCommandEffects();
    effects.loadSummaryModule.mockImplementation(async () => {
      effects.currentSourceText = '{"changed":true}';
      return {} as never;
    });

    await runPlaceholderTemplateFillCommand(effects);

    expectSourceChangedTemplateBlocked(effects);
  });

  it('命令开始时 SOURCE 已变化则不加载质量摘要模块', async () => {
    const effects = createAppTemplateFillCommandEffects({ currentSourceText: '{"changed":true}' });

    await runPlaceholderTemplateFillCommand(effects);

    expect(effects.loadSummaryModule).not.toHaveBeenCalled();
    expectSourceChangedTemplateBlocked(effects);
  });

  it('模板应用失败时保留原始错误文案', async () => {
    mocks.applyTemplate.mockImplementation(() => {
      throw new Error('当前编辑器内容为空');
    });
    const effects = createAppTemplateFillCommandEffects();

    await runTemplateFillCommand(effects);

    expectTemplateCommandFailure(effects, '当前编辑器内容为空');
  });

  it('非 Error 异常使用失败兜底文案且不写回 SOURCE', async () => {
    mocks.applyTemplate.mockImplementation(() => {
      throw 'blocked';
    });
    const effects = createAppTemplateFillCommandEffects();

    await runTemplateFillCommand(effects);

    expectTemplateCommandFailure(effects, '模板应用失败');
    expectTemplateCommandSourceUntouched(effects);
  });
});
