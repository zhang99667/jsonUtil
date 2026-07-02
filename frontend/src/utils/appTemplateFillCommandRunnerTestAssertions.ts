import { expect } from 'vitest';
import {
  getAppTemplateFillCommandRunnerMocks,
  type AppTemplateFillCommandEffectsFixture,
} from './appTemplateFillCommandRunnerTestFixture';

const mocks = getAppTemplateFillCommandRunnerMocks();

export const expectTemplateCommandQualityDeltaCleared = (
  effects: AppTemplateFillCommandEffectsFixture
) => {
  expect(effects.onSetTemplateApplyQualityDelta).toHaveBeenCalledWith('');
};

export const expectTemplateCommandSourceApplied = (
  effects: AppTemplateFillCommandEffectsFixture,
  value = '{"merged":true}'
) => {
  expect(effects.onSetSourceText).toHaveBeenCalledWith(value);
  expect(effects.currentSourceText).toBe(value);
  expect(effects.onUpdateActiveFileContent).toHaveBeenCalledWith(value);
};

export const expectTemplateCommandSourceUntouched = (
  effects: AppTemplateFillCommandEffectsFixture
) => {
  expect(effects.onSetSourceText).not.toHaveBeenCalled();
  expect(effects.onUpdateActiveFileContent).not.toHaveBeenCalled();
};

export const expectTemplateCommandFailure = (
  effects: AppTemplateFillCommandEffectsFixture,
  message: string
) => {
  expectTemplateCommandQualityDeltaCleared(effects);
  expect(effects.onShowError).toHaveBeenCalledWith(message);
};

export const expectPlaceholderQualityDeltaApplied = (
  effects: AppTemplateFillCommandEffectsFixture,
  summaryModule: never
) => {
  expect(mocks.buildAppTemplateFillQualityDelta).toHaveBeenCalledWith(expect.objectContaining({
    sourceBeforeApply: '{"a":1}',
    sourceAfterApply: '{"merged":true}',
    autoExpandScheme: true,
    summaryModule,
  }));
  expect(effects.onSetTemplateApplyQualityDelta).toHaveBeenCalledWith('质量变化: +1');
};
