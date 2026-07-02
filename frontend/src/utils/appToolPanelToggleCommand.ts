import { TransformMode } from '../types';
import { getPanelToggleEventName } from './appToolPanelCommandPlans';

export interface PanelToggleCommandConfig {
  openEventName: string;
  closeEventName: string;
  requireDeepFormat?: boolean;
}

export interface PanelToggleCommandInput {
  isOpen: boolean;
  setPanelOpen: (nextOpen: boolean) => void;
  mode: TransformMode;
  onSetMode: (mode: TransformMode) => void;
  onTrackToolEvent: (eventName: string, category: string) => void;
  openEventName: string;
  closeEventName: string;
  requireDeepFormat?: boolean;
  beforeToggle?: () => void;
}

export const APP_TOOL_PANEL_TOGGLE_COMMANDS = {
  jsonPath: {
    openEventName: 'JSONPATH_OPEN',
    closeEventName: 'JSONPATH_CLOSE',
    requireDeepFormat: true,
  },
  jsonTree: {
    openEventName: 'STRUCTURE_NAV_OPEN',
    closeEventName: 'STRUCTURE_NAV_CLOSE',
    requireDeepFormat: true,
  },
  jsonCompare: {
    openEventName: 'JSON_COMPARE_OPEN',
    closeEventName: 'JSON_COMPARE_CLOSE',
  },
  jsonSchema: {
    openEventName: 'SCHEMA_PANEL_OPEN',
    closeEventName: 'SCHEMA_PANEL_CLOSE',
  },
  schemeDecode: {
    openEventName: 'SCHEME_PANEL_OPEN',
    closeEventName: 'SCHEME_PANEL_CLOSE',
  },
  templateFill: {
    openEventName: 'TEMPLATE_PANEL_OPEN',
    closeEventName: 'TEMPLATE_PANEL_CLOSE',
  },
} satisfies Record<string, PanelToggleCommandConfig>;

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
