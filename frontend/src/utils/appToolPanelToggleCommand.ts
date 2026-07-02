import { TransformMode } from '../types';
import { getPanelToggleEventName } from './appToolPanelCommandPlans';
import type { PanelToggleCommandConfig } from './appToolPanelToggleConfigs';
export {
  APP_TOOL_PANEL_TOGGLE_COMMANDS,
  type PanelToggleCommandConfig,
} from './appToolPanelToggleConfigs';

export interface PanelToggleCommandInput extends PanelToggleCommandConfig {
  isOpen: boolean;
  setPanelOpen: (nextOpen: boolean) => void;
  mode: TransformMode;
  onSetMode: (mode: TransformMode) => void;
  onTrackToolEvent: (eventName: string, category: string) => void;
  beforeToggle?: () => void;
}

export const runPanelToggleCommand = ({
  isOpen,
  setPanelOpen,
  mode,
  onSetMode,
  onTrackToolEvent,
  openEventName,
  closeEventName,
  requireDeepFormat = false,
  beforeToggle,
}: PanelToggleCommandInput): void => {
  const nextOpen = !isOpen;
  if (requireDeepFormat && nextOpen && mode !== TransformMode.DEEP_FORMAT) {
    onSetMode(TransformMode.DEEP_FORMAT);
  }
  beforeToggle?.();
  setPanelOpen(nextOpen);
  onTrackToolEvent(getPanelToggleEventName(nextOpen, openEventName, closeEventName), 'panel');
};
