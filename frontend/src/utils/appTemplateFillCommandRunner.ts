import { isPlaceholderFillTemplateJson } from './appWorkflowHelpers';
import {
  buildAppTemplateFillQualityDelta,
  type AppTemplateFillQualitySummaryModule,
} from './appTemplateFillQualityDelta';
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

export const runAppTemplateFillCommand = async (
  {
    sourceBeforeApply,
    templateJson,
    autoExpandScheme,
  }: AppTemplateFillCommandInput,
  effects: AppTemplateFillCommandEffects
) => {
  try {
    const shouldBuildQualityDelta = isPlaceholderFillTemplateJson(templateJson);
    const summaryModule = shouldBuildQualityDelta
      ? await effects.loadSummaryModule()
      : null;

    if (summaryModule && effects.getCurrentSourceText() !== sourceBeforeApply) {
      effects.onSetTemplateApplyQualityDelta('');
      effects.onShowError('内容已变化，请重新应用模板');
      return;
    }

    const merged = applyTemplate(sourceBeforeApply, templateJson);
    if (summaryModule) {
      effects.onSetTemplateApplyQualityDelta(buildAppTemplateFillQualityDelta({
        sourceBeforeApply,
        sourceAfterApply: merged,
        autoExpandScheme,
        summaryModule,
      }));
    } else {
      effects.onSetTemplateApplyQualityDelta('');
    }

    effects.onSetSourceText(merged);
    effects.setCurrentSourceText(merged);
    effects.onUpdateActiveFileContent(merged);
    effects.onShowSuccess(summaryModule ? '占位符已回填，质量对比已更新' : '模板已应用');
  } catch (error: unknown) {
    if (dispatchChunkLoadRecoveryEvent(error)) return;

    effects.onSetTemplateApplyQualityDelta('');
    const message = error instanceof Error ? error.message : '模板应用失败';
    effects.onShowError(message);
  }
};
