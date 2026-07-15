import { showError, showSuccess } from './toast';
import type {
  AppSourceReplacementTarget,
  AppSourceReplacementTrackEvent,
  ConfirmPendingSourceReplacementInput,
  RunSourceReplacePlanInput,
} from './appSourceReplacementCommandTypes';

export const SOURCE_REPLACEMENT_STALE_MESSAGE = 'SOURCE 已变化，请重新操作';

export const isSameSourceReplacementTarget = (
  current: AppSourceReplacementTarget,
  expected: AppSourceReplacementTarget,
): boolean => current.activeFileId === expected.activeFileId
  && current.sourceText === expected.sourceText;

export const runSourceReplacePlan = ({
  plan,
  eventName,
  category,
  startedAt,
  onApply,
  onConfirm,
  onTrackToolEvent,
  onSuccessSkip,
  shouldTrackConfirmAsSkipped = false,
}: RunSourceReplacePlanInput): void => {
  if (plan.action === 'skip') {
    (plan.feedback === 'error' ? showError : showSuccess)(plan.message);
    if (plan.feedback === 'success') onSuccessSkip?.();
    onTrackToolEvent(eventName, category, 'skipped', startedAt);
    return;
  }

  if (plan.action === 'confirm') {
    onConfirm(plan.pendingText);
    if (shouldTrackConfirmAsSkipped) {
      onTrackToolEvent(eventName, category, 'skipped', startedAt);
    }
    return;
  }

  onApply(plan.text, plan.successMessage);
  onTrackToolEvent(eventName, category, 'success', startedAt);
};

export const confirmPendingSourceReplacement = ({
  pendingText,
  successMessage,
  eventName,
  category,
  onApply,
  onClearPending,
  onTrackToolEvent,
}: ConfirmPendingSourceReplacementInput): void => {
  if (pendingText === null) return;
  const startedAt = performance.now();
  onApply(pendingText, successMessage);
  onClearPending();
  onTrackToolEvent(eventName, category, 'success', startedAt);
};

export const cancelPendingSourceReplacement = (
  eventName: string,
  category: string,
  onClearPending: () => void,
  onTrackToolEvent: AppSourceReplacementTrackEvent,
): void => {
  const startedAt = performance.now();
  onClearPending();
  onTrackToolEvent(eventName, category, 'cancelled', startedAt);
};
