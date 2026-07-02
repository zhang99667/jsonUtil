import { useCallback, useState } from 'react';
import { TransformMode, type HighlightRange } from '../types';
import type { JsonPathQueryItem } from '../utils/jsonPathQuery';
import {
  getPanelToggleEventName,
  getStandaloneSourceSchemeValue,
} from '../utils/appToolPanelCommandPlans';
import { useAppChangelogCommands } from './useAppChangelogCommands';
import { useAppSettingsModalCommands } from './useAppSettingsModalCommands';
import { useAppToolPanelRequestCommands } from './useAppToolPanelRequestCommands';

type TrackPanelEvent = (eventName: string, category: string) => void;
type SetPanelOpen = (nextOpen: boolean) => void;

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

  const togglePanelOpen = useCallback((
    isOpen: boolean,
    setPanelOpen: SetPanelOpen,
    openEventName: string,
    closeEventName: string,
    requireDeepFormat = false,
    beforeToggle?: () => void
  ) => {
    const nextOpen = !isOpen;
    if (requireDeepFormat && nextOpen && mode !== TransformMode.DEEP_FORMAT) {
      onSetMode(TransformMode.DEEP_FORMAT);
    }
    beforeToggle?.();
    setPanelOpen(nextOpen);
    onTrackToolEvent(getPanelToggleEventName(nextOpen, openEventName, closeEventName), 'panel');
  }, [mode, onSetMode, onTrackToolEvent]);

  const handleToggleJsonPath = useCallback(() => {
    togglePanelOpen(isJsonPathPanelOpen, setIsJsonPathPanelOpen, 'JSONPATH_OPEN', 'JSONPATH_CLOSE', true);
  }, [isJsonPathPanelOpen, togglePanelOpen]);

  const handleToggleJsonTree = useCallback(() => {
    togglePanelOpen(isJsonTreePanelOpen, setIsJsonTreePanelOpen, 'STRUCTURE_NAV_OPEN', 'STRUCTURE_NAV_CLOSE', true);
  }, [isJsonTreePanelOpen, togglePanelOpen]);

  const handleToggleJsonCompare = useCallback(() => {
    togglePanelOpen(isJsonComparePanelOpen, setIsJsonComparePanelOpen, 'JSON_COMPARE_OPEN', 'JSON_COMPARE_CLOSE');
  }, [isJsonComparePanelOpen, togglePanelOpen]);

  const handleToggleJsonSchema = useCallback(() => {
    togglePanelOpen(isJsonSchemaPanelOpen, setIsJsonSchemaPanelOpen, 'SCHEMA_PANEL_OPEN', 'SCHEMA_PANEL_CLOSE');
  }, [isJsonSchemaPanelOpen, togglePanelOpen]);

  const handleToggleSchemeDecode = useCallback(() => {
    togglePanelOpen(isSchemeDecodeOpen, setIsSchemeDecodeOpen, 'SCHEME_PANEL_OPEN', 'SCHEME_PANEL_CLOSE');
  }, [isSchemeDecodeOpen, togglePanelOpen]);

  const handleToggleTemplateFill = useCallback(() => {
    togglePanelOpen(isTemplatePanelOpen, setIsTemplatePanelOpen, 'TEMPLATE_PANEL_OPEN', 'TEMPLATE_PANEL_CLOSE', false, () => setTemplateApplyQualityDelta(''));
  }, [isTemplatePanelOpen, togglePanelOpen]);

  const handleLocateJsonPath = useCallback((query: string) => {
    const request = requestJsonPathQuery(query);
    if (!request) return;

    if (mode !== TransformMode.DEEP_FORMAT) {
      onSetMode(TransformMode.DEEP_FORMAT);
    }

    onSetHighlightRange(null);
    setIsJsonPathPanelOpen(true);
    setIsTransformReportOpen(false);
    onTrackToolEvent('JSONPATH_LOCATE', 'panel');
  }, [mode, onSetHighlightRange, onSetMode, onTrackToolEvent, requestJsonPathQuery]);

  const handleLocateJsonPathResultInStructure = useCallback((item: JsonPathQueryItem) => {
    requestJsonTreeFocus(item);
    setIsJsonTreePanelOpen(true);
    setIsTransformReportOpen(false);
    onTrackToolEvent('STRUCTURE_NAV_LOCATE', 'panel');
  }, [onTrackToolEvent, requestJsonTreeFocus]);

  const openStandaloneSchemePanel = useCallback((value: string, eventName: string) => {
    if (!value) return;

    requestSchemeInput(value);
    setIsSchemeDecodeOpen(true);
    setIsTransformReportOpen(false);
    onTrackToolEvent(eventName, 'panel');
  }, [onTrackToolEvent, requestSchemeInput]);

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
    setIsTransformReportOpen(false);
    onTrackToolEvent('TEMPLATE_OPEN_FROM_REPORT', 'panel');
  }, [onTrackToolEvent, requestTemplateFill]);

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
