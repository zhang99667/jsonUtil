import type { AppSourceReplacePlan } from './appSourceReplacePlans';
import type { ToolEventStatus } from './productTelemetry';
import { showError, showSuccess } from './toast';

export type AppSourceReplacementTrackEvent = (
  eventName: string,
  category: string,
  status?: ToolEventStatus,
  startedAt?: number,
) => void;

interface RunSourceReplacePlanInput {
  plan: AppSourceReplacePlan;
  eventName: string;
  category: string;
  startedAt: number;
  onApply: (text: string, successMessage: string) => void;
  onConfirm: (text: string) => void;
  onTrackToolEvent: AppSourceReplacementTrackEvent;
  onSuccessSkip?: () => void;
  shouldTrackConfirmAsSkipped?: boolean;
}

interface ConfirmPendingSourceReplacementInput {
  pendingText: string | null;
  successMessage: string;
  eventName: string;
  category: string;
  onApply: (text: string, successMessage: string) => void;
  onClearPending: () => void;
  onTrackToolEvent: AppSourceReplacementTrackEvent;
}

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
