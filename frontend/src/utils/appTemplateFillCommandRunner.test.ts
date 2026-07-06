import { beforeEach, describe, expect, it } from 'vitest';
import {
  createAppTemplateFillCommandEffects,
  getAppTemplateFillCommandRunnerMocks,
  resetAppTemplateFillCommandRunnerMocks,
  runPlaceholderTemplateFillCommand,
  runTemplateFillCommand,
} from './appTemplateFillCommandRunnerTestFixture';
import {
  expectPlaceholderQualityDeltaApplied,
  expectTemplateCommandQualityDeltaCleared,
  expectTemplateCommandSourceApplied,
} from './appTemplateFillCommandRunnerTestAssertions';

const mocks = getAppTemplateFillCommandRunnerMocks();

describe('appTemplateFillCommandRunner', () => {
  beforeEach(() => {
    resetAppTemplateFillCommandRunnerMocks();
  });

  it('应用普通模板时更新 SOURCE 并清空质量 delta', async () => {
    const effects = createAppTemplateFillCommandEffects();

    await runTemplateFillCommand(effects);

    expect(effects.loadSummaryModule).not.toHaveBeenCalled();
    expect(mocks.buildAppTemplateFillQualityDelta).not.toHaveBeenCalled();
    expect(mocks.applyTemplate).toHaveBeenCalledWith('{"a":1}', '{"b":2}');
    expectTemplateCommandQualityDeltaCleared(effects);
    expectTemplateCommandSourceApplied(effects);
    expect(effects.onShowSuccess).toHaveBeenCalledWith('模板已应用');
  });

  it('占位符回填模板会生成质量 delta', async () => {
    const summaryModule = { marker: 'summary' } as never;
    const effects = createAppTemplateFillCommandEffects();
    effects.loadSummaryModule.mockResolvedValue(summaryModule);

    await runPlaceholderTemplateFillCommand(effects);

    expect(effects.loadSummaryModule).toHaveBeenCalledTimes(1);
    expectPlaceholderQualityDeltaApplied(effects, summaryModule);
    expect(effects.onShowSuccess).toHaveBeenCalledWith('占位符已回填，质量对比已更新');
  });
});
