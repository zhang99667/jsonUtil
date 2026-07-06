import { isPlaceholderFillTemplateJson } from './appWorkflowHelpers';
import { tryBuildAppTemplateFillQualityDelta, type AppTemplateFillQualitySummaryModule } from './appTemplateFillQualityDelta';
import { dispatchChunkLoadRecoveryEvent } from './chunkLoadRecoveryDispatch';
import { applyTemplate } from './transformations';

interface AppTemplateFillCommandInput {
  sourceBeforeApply: string;
  templateJson: string;
  autoExpandScheme: boolean;
}

export interface AppTemplateFillCommandEffects {
  getCurrentSourceText: () => string;
  setCurrentSourceText: (value: string) => void;
  loadSummaryModule: () => Promise<AppTemplateFillQualitySummaryModule>;
  onSetSourceText: (value: string) => void;
  onUpdateActiveFileContent: (value: string) => void;
  onSetTemplateApplyQualityDelta: (value: string) => void;
  onShowError: (message: string) => void;
  onShowSuccess: (message: string) => void;
}

const abortTemplateFillIfSourceChanged = (sourceBeforeApply: string, effects: AppTemplateFillCommandEffects): boolean => {
  if (effects.getCurrentSourceText() === sourceBeforeApply) return false;
  effects.onSetTemplateApplyQualityDelta('');
  effects.onShowError('内容已变化，请重新应用模板');
  return true;
};

export const runAppTemplateFillCommand = async (
  {
    sourceBeforeApply,
    templateJson,
    autoExpandScheme,
  }: AppTemplateFillCommandInput,
  effects: AppTemplateFillCommandEffects
) => {
  try {
    if (abortTemplateFillIfSourceChanged(sourceBeforeApply, effects)) return;

    const shouldLoadSummary = isPlaceholderFillTemplateJson(templateJson);
    let isSummaryChunkRecoveryHandled = false;
    const summaryModule = shouldLoadSummary
      ? await effects.loadSummaryModule().catch(error => {
        isSummaryChunkRecoveryHandled = dispatchChunkLoadRecoveryEvent(error);
        return null;
      })
      : null;
    if (isSummaryChunkRecoveryHandled) return;

    if (shouldLoadSummary && abortTemplateFillIfSourceChanged(sourceBeforeApply, effects)) return;

    const merged = applyTemplate(sourceBeforeApply, templateJson);
    const qualityDelta = summaryModule
      ? tryBuildAppTemplateFillQualityDelta({
        sourceBeforeApply,
        sourceAfterApply: merged,
        autoExpandScheme,
        summaryModule,
      })
      : '';

    effects.onSetTemplateApplyQualityDelta(qualityDelta);
    effects.onSetSourceText(merged);
    effects.setCurrentSourceText(merged);
    effects.onUpdateActiveFileContent(merged);
    const successMessage = shouldLoadSummary
      ? qualityDelta ? '占位符已回填，质量对比已更新' : '占位符已回填，质量对比暂不可用'
      : '模板已应用';
    effects.onShowSuccess(successMessage);
  } catch (error: unknown) {
    if (dispatchChunkLoadRecoveryEvent(error)) return;

    effects.onSetTemplateApplyQualityDelta('');
    const message = error instanceof Error ? error.message : '模板应用失败';
    effects.onShowError(message);
  }
};
