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

  const togglePanelState = useCallback((
    command: PanelToggleCommandConfig,
    isOpen: boolean,
    setPanelOpen: TogglePanelOpenInput['setPanelOpen'],
    beforeToggle?: TogglePanelOpenInput['beforeToggle']
  ) => {
    togglePanelOpen({ ...command, isOpen, setPanelOpen, beforeToggle });
  }, [togglePanelOpen]);

  const handleToggleJsonPath = useCallback(() => {
    togglePanelState(PANEL_TOGGLE_COMMANDS.jsonPath, isJsonPathPanelOpen, onSetJsonPathPanelOpen);
  }, [isJsonPathPanelOpen, onSetJsonPathPanelOpen, togglePanelState]);

  const handleToggleJsonTree = useCallback(() => {
    togglePanelState(PANEL_TOGGLE_COMMANDS.jsonTree, isJsonTreePanelOpen, onSetJsonTreePanelOpen);
  }, [isJsonTreePanelOpen, onSetJsonTreePanelOpen, togglePanelState]);

  const handleToggleJsonCompare = useCallback(() => {
    togglePanelState(PANEL_TOGGLE_COMMANDS.jsonCompare, isJsonComparePanelOpen, onSetJsonComparePanelOpen);
  }, [isJsonComparePanelOpen, onSetJsonComparePanelOpen, togglePanelState]);

  const handleToggleJsonSchema = useCallback(() => {
    togglePanelState(PANEL_TOGGLE_COMMANDS.jsonSchema, isJsonSchemaPanelOpen, onSetJsonSchemaPanelOpen);
  }, [isJsonSchemaPanelOpen, onSetJsonSchemaPanelOpen, togglePanelState]);

  const handleToggleSchemeDecode = useCallback(() => {
    togglePanelState(PANEL_TOGGLE_COMMANDS.schemeDecode, isSchemeDecodeOpen, onSetSchemeDecodeOpen);
  }, [isSchemeDecodeOpen, onSetSchemeDecodeOpen, togglePanelState]);

  const handleToggleTemplateFill = useCallback(() => {
    togglePanelState(
      PANEL_TOGGLE_COMMANDS.templateFill,
      isTemplatePanelOpen,
      onSetTemplatePanelOpen,
      onClearTemplateApplyQualityDelta
    );
  }, [isTemplatePanelOpen, onClearTemplateApplyQualityDelta, onSetTemplatePanelOpen, togglePanelState]);

  return {
    handleToggleJsonCompare,
    handleToggleJsonPath,
    handleToggleJsonSchema,
    handleToggleJsonTree,
    handleToggleSchemeDecode,
    handleToggleTemplateFill,
  };
};
