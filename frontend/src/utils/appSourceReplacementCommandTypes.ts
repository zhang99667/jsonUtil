import type { AppSourceReplacePlan } from './appSourceReplacePlans';
import type { ToolEventStatus } from './productTelemetry';

export type AppSourceReplacementTrackEvent = (
  eventName: string,
  category: string,
  status?: ToolEventStatus,
  startedAt?: number,
) => void;

export interface RunSourceReplacePlanInput {
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

export interface ConfirmPendingSourceReplacementInput {
  pendingText: string | null;
  successMessage: string;
  eventName: string;
  category: string;
  onApply: (text: string, successMessage: string) => void;
  onClearPending: () => void;
  onTrackToolEvent: AppSourceReplacementTrackEvent;
}
