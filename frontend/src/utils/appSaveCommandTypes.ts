import type { ToolEventStatus } from './productTelemetry';
import type { AppSaveEditor } from './appSaveActionPlanTypes';

export type AppSaveTrackEvent = (
  eventName: string,
  category: string,
  status?: ToolEventStatus,
  startedAt?: number,
) => void;

export interface AppSaveCommandInput {
  activeEditor: AppSaveEditor;
  hasActiveFile: boolean;
  activeFileHasHandle: boolean;
  previewText: string;
  isOutputTransforming: boolean;
}

export type AppToolbarSaveCommandInput = Pick<AppSaveCommandInput, 'activeEditor' | 'hasActiveFile'>;

export interface AppSaveCommandEffects {
  onSaveFile: (content?: string) => Promise<boolean>;
  onSaveSourceAs: () => Promise<boolean>;
  onSavePreviewAs: () => Promise<boolean>;
  onShowError: (message: string) => void;
  onShowSuccess: (message: string) => void;
  onTrackToolEvent: AppSaveTrackEvent;
  now?: () => number;
}
