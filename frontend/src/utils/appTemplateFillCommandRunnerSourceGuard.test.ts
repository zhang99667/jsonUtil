import { beforeEach, describe, expect, it } from 'vitest';
import {
  createAppTemplateFillCommandEffects,
  resetAppTemplateFillCommandRunnerMocks,
  runPlaceholderTemplateFillCommand,
} from './appTemplateFillCommandRunnerTestFixture';
import { expectSourceChangedTemplateBlocked } from './appTemplateFillCommandRunnerTestAssertions';

describe('appTemplateFillCommandRunner source guard', () => {
  beforeEach(() => {
    resetAppTemplateFillCommandRunnerMocks();
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
});
