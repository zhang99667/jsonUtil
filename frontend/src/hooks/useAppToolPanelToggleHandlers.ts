import { useCallback } from 'react';

import { TransformMode } from '../types';
import {
  APP_TOOL_PANEL_TOGGLE_COMMANDS as PANEL_TOGGLE_COMMANDS,
  runPanelToggleCommand,
  type PanelToggleCommandConfig,
  type PanelToggleCommandInput,
} from '../utils/appToolPanelToggleCommand';

type TrackPanelEvent = (eventName: string, category: string) => void;
type TogglePanelOpenInput = Omit<PanelToggleCommandInput, 'mode' | 'onSetMode' | 'onTrackToolEvent'>;
type PanelOpenSetter = (nextOpen: boolean) => void;
type TogglePanelOpen = (input: TogglePanelOpenInput) => void;

interface UseAppToolPanelToggleHandlersInput {
  mode: TransformMode;
  isJsonPathPanelOpen: boolean;
  isJsonTreePanelOpen: boolean;
  isJsonComparePanelOpen: boolean;
  isJsonSchemaPanelOpen: boolean;
  isSchemeDecodeOpen: boolean;
  isTemplatePanelOpen: boolean;
  onSetMode: (mode: TransformMode) => void;
  onSetJsonPathPanelOpen: PanelOpenSetter;
  onSetJsonTreePanelOpen: PanelOpenSetter;
  onSetJsonComparePanelOpen: PanelOpenSetter;
  onSetJsonSchemaPanelOpen: PanelOpenSetter;
  onSetSchemeDecodeOpen: PanelOpenSetter;
  onSetTemplatePanelOpen: PanelOpenSetter;
  onClearTemplateApplyQualityDelta: () => void;
  onTrackToolEvent: TrackPanelEvent;
}

const usePanelToggleHandler = (
  togglePanelOpen: TogglePanelOpen,
  command: PanelToggleCommandConfig,
  isOpen: boolean,
  setPanelOpen: TogglePanelOpenInput['setPanelOpen'],
  beforeToggle?: TogglePanelOpenInput['beforeToggle']
) => useCallback(() => {
  togglePanelOpen({ ...command, isOpen, setPanelOpen, beforeToggle });
}, [beforeToggle, command, isOpen, setPanelOpen, togglePanelOpen]);

export const useAppToolPanelToggleHandlers = ({
  mode,
  isJsonPathPanelOpen,
  isJsonTreePanelOpen,
  isJsonComparePanelOpen,
  isJsonSchemaPanelOpen,
  isSchemeDecodeOpen,
  isTemplatePanelOpen,
  onSetMode,
  onSetJsonPathPanelOpen,
  onSetJsonTreePanelOpen,
  onSetJsonComparePanelOpen,
  onSetJsonSchemaPanelOpen,
  onSetSchemeDecodeOpen,
  onSetTemplatePanelOpen,
  onClearTemplateApplyQualityDelta,
  onTrackToolEvent,
}: UseAppToolPanelToggleHandlersInput) => {
  const togglePanelOpen = useCallback((input: TogglePanelOpenInput) => {
    runPanelToggleCommand({ ...input, mode, onSetMode, onTrackToolEvent });
  }, [mode, onSetMode, onTrackToolEvent]);

  const handleToggleJsonPath = usePanelToggleHandler(togglePanelOpen, PANEL_TOGGLE_COMMANDS.jsonPath, isJsonPathPanelOpen, onSetJsonPathPanelOpen);
  const handleToggleJsonTree = usePanelToggleHandler(togglePanelOpen, PANEL_TOGGLE_COMMANDS.jsonTree, isJsonTreePanelOpen, onSetJsonTreePanelOpen);
  const handleToggleJsonCompare = usePanelToggleHandler(togglePanelOpen, PANEL_TOGGLE_COMMANDS.jsonCompare, isJsonComparePanelOpen, onSetJsonComparePanelOpen);
  const handleToggleJsonSchema = usePanelToggleHandler(togglePanelOpen, PANEL_TOGGLE_COMMANDS.jsonSchema, isJsonSchemaPanelOpen, onSetJsonSchemaPanelOpen);
  const handleToggleSchemeDecode = usePanelToggleHandler(togglePanelOpen, PANEL_TOGGLE_COMMANDS.schemeDecode, isSchemeDecodeOpen, onSetSchemeDecodeOpen);
  const handleToggleTemplateFill = usePanelToggleHandler(
    togglePanelOpen,
    PANEL_TOGGLE_COMMANDS.templateFill,
    isTemplatePanelOpen,
    onSetTemplatePanelOpen,
    onClearTemplateApplyQualityDelta
  );

  return {
    handleToggleJsonCompare,
    handleToggleJsonPath,
    handleToggleJsonSchema,
    handleToggleJsonTree,
    handleToggleSchemeDecode,
    handleToggleTemplateFill,
  };
};
