import { isPlaceholderFillTemplateJson } from './appWorkflowHelpers';
import { buildAppTemplateFillCommandResult } from './appTemplateFillCommandBuildResult';
import { commitAppTemplateFillCommandResult } from './appTemplateFillCommandResult';
import type {
  AppTemplateFillCommandEffects,
  AppTemplateFillCommandInput,
} from './appTemplateFillCommandRunnerTypes';
import { abortTemplateFillIfSourceChanged } from './appTemplateFillCommandSourceGuard';
import { loadAppTemplateFillQualitySummaryModule } from './appTemplateFillQualitySummary';
import { dispatchChunkLoadRecoveryEvent } from './chunkLoadRecoveryDispatch';
import { getErrorMessage } from './errors';

export const runAppTemplateFillCommand = async (
  input: AppTemplateFillCommandInput,
  effects: AppTemplateFillCommandEffects
) => {
  const { sourceBeforeApply, templateJson, autoExpandScheme } = input;

  try {
    if (abortTemplateFillIfSourceChanged(sourceBeforeApply, effects)) return;

    const shouldLoadSummary = isPlaceholderFillTemplateJson(templateJson);
    const { summaryModule, isChunkRecoveryHandled } = await loadAppTemplateFillQualitySummaryModule({
      shouldLoadSummary,
      loadSummaryModule: effects.loadSummaryModule,
    });
    if (isChunkRecoveryHandled) return;

    if (shouldLoadSummary && abortTemplateFillIfSourceChanged(sourceBeforeApply, effects)) return;

    const { merged, qualityDelta } = buildAppTemplateFillCommandResult({
      sourceBeforeApply,
      templateJson,
      autoExpandScheme,
      summaryModule,
    });

    commitAppTemplateFillCommandResult({ effects, merged, shouldLoadSummary, qualityDelta });
  } catch (error: unknown) {
    if (dispatchChunkLoadRecoveryEvent(error)) return;

    effects.onSetTemplateApplyQualityDelta('');
    effects.onShowError(getErrorMessage(error, '模板应用失败'));
  }
};
