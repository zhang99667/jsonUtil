import type { TransformMode } from '../types';
import type {
  AppSmartSuggestionCommandEffects,
  AppSmartSuggestionTrackEvent,
} from './appSmartSuggestionCommandRunner';

export interface SmartSuggestionSchemeInputRequest {
  id: number;
  value: string;
}

interface AppSmartSuggestionCommandEffectsInput {
  schemeInputRequestIdRef: { current: number };
  onRunAiFix: () => void;
  onSetMode: (mode: TransformMode) => void;
  onSetHighlightRange: (range: null) => void;
  onSetSchemeInputRequest: (request: SmartSuggestionSchemeInputRequest) => void;
  onSetSchemePanelOpen: (isOpen: boolean) => void;
  onSetTransformReportOpen: (isOpen: boolean) => void;
  onSetJsonTreePanelOpen: (isOpen: boolean) => void;
  onSetJsonSchemaPanelOpen: (isOpen: boolean) => void;
  onShowError: (message: string) => void;
  onShowSuccess: (message: string) => void;
  onTrackToolEvent: AppSmartSuggestionTrackEvent;
}

export const buildAppSmartSuggestionCommandEffects = ({
  schemeInputRequestIdRef,
  onRunAiFix,
  onSetMode,
  onSetHighlightRange,
  onSetSchemeInputRequest,
  onSetSchemePanelOpen,
  onSetTransformReportOpen,
  onSetJsonTreePanelOpen,
  onSetJsonSchemaPanelOpen,
  onShowError,
  onShowSuccess,
  onTrackToolEvent,
}: AppSmartSuggestionCommandEffectsInput): AppSmartSuggestionCommandEffects => ({
  onRunAiFix,
  onSetMode,
  onClearHighlight: () => onSetHighlightRange(null),
  onOpenSchemeInput: (value) => onSetSchemeInputRequest({
    id: ++schemeInputRequestIdRef.current,
    value,
  }),
  onSetSchemePanelOpen,
  onSetTransformReportOpen,
  onSetJsonTreePanelOpen,
  onSetJsonSchemaPanelOpen,
  onShowError,
  onShowSuccess,
  onTrackToolEvent,
});
