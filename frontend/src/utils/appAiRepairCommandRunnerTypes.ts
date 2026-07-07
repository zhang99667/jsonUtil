import { TransformMode, type AIConfig } from '../types';
import type { FixJsonResult } from '../services/aiService';
import type { AiRepairSummary } from './aiRepairSummary';
import type { ToolEventStatus } from './productTelemetry';

export type AppAiRepairTrackEvent = (
  eventName: string,
  category: string,
  status?: ToolEventStatus,
  startedAt?: number,
) => void;

export type AppAiRepairSummaryBuilder = (
  before: string,
  after: string,
  options: {
    repairMethod: FixJsonResult['repairMethod'];
    localRuleLabels: string[];
  },
) => AiRepairSummary;

export interface AppAiRepairRuntime {
  fixJsonWithRepairDetails: (
    sourceText: string,
    aiConfig: AIConfig,
    options?: { signal?: AbortSignal },
  ) => Promise<FixJsonResult>;
  buildAiRepairSummary: AppAiRepairSummaryBuilder;
}

export interface RunAppAiRepairCommandInput {
  sourceText: string;
  aiConfig: AIConfig;
  startedAt: number;
  signal?: AbortSignal;
}

export interface RunAppAiRepairCommandEffects {
  onLoadRuntime: () => Promise<AppAiRepairRuntime>;
  onSetRepairing: (isRepairing: boolean) => void;
  onApplyFixedJson: (fixedJson: string, summary: AiRepairSummary) => void;
  onSetMode: (mode: TransformMode) => void;
  onOpenAiSettings: () => void;
  onTrackToolEvent: AppAiRepairTrackEvent;
  onShowError: (message: string) => void;
  onShowSuccess: (message: string) => void;
}
