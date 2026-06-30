import { getClipboardErrorMessage } from './clipboard';
import { getCopySuccessMessage } from './appWorkflowHelpers';
import type { ToolEventStatus } from './productTelemetry';

type AppCopyTrackEvent = (
  eventName: string,
  category: string,
  status?: ToolEventStatus,
  startedAt?: number,
) => void;

interface AppCopyCommandEffects {
  onCopyText: (text: string) => Promise<void>;
  onShowError: (message: string) => void;
  onShowSuccess: (message: string) => void;
  onTrackToolEvent: AppCopyTrackEvent;
  now?: () => number;
}

export const runAppCopySourceCommand = async (
  sourceText: string,
  effects: AppCopyCommandEffects,
) => {
  const startedAt = effects.now?.() ?? performance.now();
  if (!sourceText.trim()) {
    effects.onShowError('源内容为空，暂无可复制内容');
    effects.onTrackToolEvent('SOURCE_COPY', 'editor', 'skipped', startedAt);
    return;
  }

  try {
    await effects.onCopyText(sourceText);
    effects.onShowSuccess(getCopySuccessMessage('源内容', sourceText));
    effects.onTrackToolEvent('SOURCE_COPY', 'editor', 'success', startedAt);
  } catch (error) {
    effects.onShowError(getClipboardErrorMessage(error, '复制源内容失败'));
    effects.onTrackToolEvent('SOURCE_COPY', 'editor', 'error', startedAt);
  }
};

export const runAppCopyPreviewCommand = async (
  previewText: string,
  isOutputTransforming: boolean,
  effects: AppCopyCommandEffects,
) => {
  const startedAt = effects.now?.() ?? performance.now();
  if (isOutputTransforming) {
    effects.onShowError('预览仍在处理，请稍后复制');
    effects.onTrackToolEvent('PREVIEW_COPY', 'editor', 'skipped', startedAt);
    return;
  }

  if (!previewText.trim()) {
    effects.onShowError('预览内容为空，暂无可复制内容');
    effects.onTrackToolEvent('PREVIEW_COPY', 'editor', 'skipped', startedAt);
    return;
  }

  try {
    await effects.onCopyText(previewText);
    effects.onShowSuccess(getCopySuccessMessage('预览内容', previewText));
    effects.onTrackToolEvent('PREVIEW_COPY', 'editor', 'success', startedAt);
  } catch (error) {
    effects.onShowError(getClipboardErrorMessage(error));
    effects.onTrackToolEvent('PREVIEW_COPY', 'editor', 'error', startedAt);
  }
};
