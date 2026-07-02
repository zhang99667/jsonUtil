import { useCallback, useState } from 'react';
import { TransformMode, type HighlightRange } from '../types';
import {
  APP_TOOL_PANEL_TOGGLE_COMMANDS as PANEL_TOGGLE_COMMANDS,
  runPanelToggleCommand,
  type PanelToggleCommandConfig,
  type PanelToggleCommandInput,
} from '../utils/appToolPanelToggleCommand';
import { useAppChangelogCommands } from './useAppChangelogCommands';
import { useAppSettingsModalCommands } from './useAppSettingsModalCommands';
import { useAppToolPanelActionCommands } from './useAppToolPanelActionCommands';
import { useAppToolPanelRequestCommands } from './useAppToolPanelRequestCommands';

type TrackPanelEvent = (eventName: string, category: string) => void;
type TogglePanelOpenInput = Omit<PanelToggleCommandInput, 'mode' | 'onSetMode' | 'onTrackToolEvent'>;

interface UseAppToolPanelCommandsInput {
  mode: TransformMode;
  sourceText: string;
  onSetMode: (mode: TransformMode) => void;
  onSetHighlightRange: (range: HighlightRange | null) => void;
  onTrackToolEvent: TrackPanelEvent;
}

export const useAppToolPanelCommands = ({
  mode,
  sourceText,
  onSetMode,
  onSetHighlightRange,
  onTrackToolEvent,
}: UseAppToolPanelCommandsInput) => {
  const [isJsonPathPanelOpen, setIsJsonPathPanelOpen] = useState(false);
  const [isJsonTreePanelOpen, setIsJsonTreePanelOpen] = useState(false);
  const [isJsonComparePanelOpen, setIsJsonComparePanelOpen] = useState(false);
  const [isJsonSchemaPanelOpen, setIsJsonSchemaPanelOpen] = useState(false);
  const {
    jsonPathQueryRequest,
    jsonTreeFocusRequest,
    requestJsonPathQuery,
    requestJsonTreeFocus,
    requestSchemeInput,
    requestTemplateFill,
    schemeInputRequest,
    templateFillRequest,
  } = useAppToolPanelRequestCommands();
  const {
    handleOpenAiSettings,
    handleOpenSettingsPanel,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    settingsInitialTab,
  } = useAppSettingsModalCommands({ onTrackToolEvent });
  const {
    changelogHighlightedVersion,
    changelogSourceMarkdown,
    handleCloseChangelog,
    handleOpenChangelog,
    isChangelogModalOpen,
  } = useAppChangelogCommands();
  const [isSchemeDecodeOpen, setIsSchemeDecodeOpen] = useState(false);
  const [isTemplatePanelOpen, setIsTemplatePanelOpen] = useState(false);
  const [templateApplyQualityDelta, setTemplateApplyQualityDelta] = useState('');
  const [isTransformReportOpen, setIsTransformReportOpen] = useState(false);

  const closeTransformReportPanel = useCallback(() => setIsTransformReportOpen(false), []);

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
    togglePanelState(PANEL_TOGGLE_COMMANDS.jsonPath, isJsonPathPanelOpen, setIsJsonPathPanelOpen);
  }, [isJsonPathPanelOpen, togglePanelState]);

  const handleToggleJsonTree = useCallback(() => {
    togglePanelState(PANEL_TOGGLE_COMMANDS.jsonTree, isJsonTreePanelOpen, setIsJsonTreePanelOpen);
  }, [isJsonTreePanelOpen, togglePanelState]);

  const handleToggleJsonCompare = useCallback(() => {
    togglePanelState(PANEL_TOGGLE_COMMANDS.jsonCompare, isJsonComparePanelOpen, setIsJsonComparePanelOpen);
  }, [isJsonComparePanelOpen, togglePanelState]);

  const handleToggleJsonSchema = useCallback(() => {
    togglePanelState(PANEL_TOGGLE_COMMANDS.jsonSchema, isJsonSchemaPanelOpen, setIsJsonSchemaPanelOpen);
  }, [isJsonSchemaPanelOpen, togglePanelState]);

  const handleToggleSchemeDecode = useCallback(() => {
    togglePanelState(PANEL_TOGGLE_COMMANDS.schemeDecode, isSchemeDecodeOpen, setIsSchemeDecodeOpen);
  }, [isSchemeDecodeOpen, togglePanelState]);

  const handleToggleTemplateFill = useCallback(() => {
    togglePanelState(
      PANEL_TOGGLE_COMMANDS.templateFill,
      isTemplatePanelOpen,
      setIsTemplatePanelOpen,
      () => setTemplateApplyQualityDelta('')
    );
  }, [isTemplatePanelOpen, togglePanelState]);

  const {
    handleLocateJsonPath,
    handleLocateJsonPathResultInStructure,
    handleOpenSchemeFromReport,
    handleOpenSchemeFromSourceStatus,
    handleOpenSchemeFromStructure,
    handleOpenSourceSchemeInput,
    handleOpenTemplateFillFromReport,
  } = useAppToolPanelActionCommands({
    closeTransformReportPanel,
    mode,
    onSetHighlightRange,
    onSetMode,
    onTrackToolEvent,
    requestJsonPathQuery,
    requestJsonTreeFocus,
    requestSchemeInput,
    requestTemplateFill,
    setIsJsonPathPanelOpen,
    setIsJsonTreePanelOpen,
    setIsSchemeDecodeOpen,
    setIsTemplatePanelOpen,
    setTemplateApplyQualityDelta,
    sourceText,
  });

  const handleCloseJsonPathPanel = useCallback(() => {
    setIsJsonPathPanelOpen(false);
    onSetHighlightRange(null);
  }, [onSetHighlightRange]);

  return {
    changelogHighlightedVersion,
    changelogSourceMarkdown,
    handleCloseChangelog,
    handleCloseJsonPathPanel,
    handleLocateJsonPath,
    handleLocateJsonPathResultInStructure,
    handleOpenAiSettings,
    handleOpenChangelog,
    handleOpenSchemeFromReport,
    handleOpenSchemeFromSourceStatus,
    handleOpenSchemeFromStructure,
    handleOpenSettingsPanel,
    handleOpenSourceSchemeInput,
    handleOpenTemplateFillFromReport,
    handleToggleJsonCompare,
    handleToggleJsonPath,
    handleToggleJsonSchema,
    handleToggleJsonTree,
    requestSchemeInput,
    handleToggleSchemeDecode,
    handleToggleTemplateFill,
    isChangelogModalOpen,
    isJsonComparePanelOpen,
    isJsonPathPanelOpen,
    isJsonSchemaPanelOpen,
    isJsonTreePanelOpen,
    isSchemeDecodeOpen,
    isSettingsModalOpen,
    isTemplatePanelOpen,
    isTransformReportOpen,
    jsonPathQueryRequest,
    jsonTreeFocusRequest,
    schemeInputRequest,
    setIsJsonComparePanelOpen,
    setIsJsonPathPanelOpen,
    setIsJsonSchemaPanelOpen,
    setIsJsonTreePanelOpen,
    setIsSchemeDecodeOpen,
    setIsSettingsModalOpen,
    setIsTemplatePanelOpen,
    setIsTransformReportOpen,
    setTemplateApplyQualityDelta,
    settingsInitialTab,
    templateApplyQualityDelta,
    templateFillRequest,
  };
};
