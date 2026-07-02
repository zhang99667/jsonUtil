import { useCallback, useState } from 'react';
import { TransformMode, type HighlightRange } from '../types';
import type { JsonPathQueryItem } from '../utils/jsonPathQuery';
import { getStandaloneSourceSchemeValue } from '../utils/appToolPanelCommandPlans';
import {
  APP_TOOL_PANEL_TOGGLE_COMMANDS as PANEL_TOGGLE_COMMANDS,
  runPanelToggleCommand,
  type PanelToggleCommandConfig,
  type PanelToggleCommandInput,
} from '../utils/appToolPanelToggleCommand';
import { useAppChangelogCommands } from './useAppChangelogCommands';
import { useAppSettingsModalCommands } from './useAppSettingsModalCommands';
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

  const handleLocateJsonPath = useCallback((query: string) => {
    const request = requestJsonPathQuery(query);
    if (!request) return;

    if (mode !== TransformMode.DEEP_FORMAT) {
      onSetMode(TransformMode.DEEP_FORMAT);
    }

    onSetHighlightRange(null);
    setIsJsonPathPanelOpen(true);
    closeTransformReportPanel();
    onTrackToolEvent('JSONPATH_LOCATE', 'panel');
  }, [closeTransformReportPanel, mode, onSetHighlightRange, onSetMode, onTrackToolEvent, requestJsonPathQuery]);

  const handleLocateJsonPathResultInStructure = useCallback((item: JsonPathQueryItem) => {
    requestJsonTreeFocus(item);
    setIsJsonTreePanelOpen(true);
    closeTransformReportPanel();
    onTrackToolEvent('STRUCTURE_NAV_LOCATE', 'panel');
  }, [closeTransformReportPanel, onTrackToolEvent, requestJsonTreeFocus]);

  const openStandaloneSchemePanel = useCallback((value: string, eventName: string) => {
    if (!value) return;

    requestSchemeInput(value);
    setIsSchemeDecodeOpen(true);
    closeTransformReportPanel();
    onTrackToolEvent(eventName, 'panel');
  }, [closeTransformReportPanel, onTrackToolEvent, requestSchemeInput]);

  const handleOpenSchemeFromReport = useCallback((value: string) => {
    openStandaloneSchemePanel(value, 'SCHEME_OPEN_FROM_REPORT');
  }, [openStandaloneSchemePanel]);

  const handleOpenSchemeFromStructure = useCallback((value: string) => {
    openStandaloneSchemePanel(value, 'SCHEME_OPEN_FROM_STRUCTURE');
    setIsJsonTreePanelOpen(false);
  }, [openStandaloneSchemePanel]);

  const handleOpenSchemeFromSourceStatus = useCallback((value: string) => {
    openStandaloneSchemePanel(value, 'SCHEME_OPEN_FROM_SOURCE_STATUS');
  }, [openStandaloneSchemePanel]);

  const handleOpenSourceSchemeInput = useCallback(() => {
    const value = getStandaloneSourceSchemeValue(sourceText);
    if (!value) return;

    handleOpenSchemeFromSourceStatus(value);
  }, [handleOpenSchemeFromSourceStatus, sourceText]);

  const handleOpenTemplateFillFromReport = useCallback((template: string) => {
    const request = requestTemplateFill(template);
    if (!request) return;

    setTemplateApplyQualityDelta('');
    setIsTemplatePanelOpen(true);
    closeTransformReportPanel();
    onTrackToolEvent('TEMPLATE_OPEN_FROM_REPORT', 'panel');
  }, [closeTransformReportPanel, onTrackToolEvent, requestTemplateFill]);

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
