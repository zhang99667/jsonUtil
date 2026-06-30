import { useCallback, useEffect, useRef, useState } from 'react';
import { TransformMode, type HighlightRange } from '../types';
import { APP_CHANGELOG_OPEN_EVENT, type AppChangelogOpenDetail } from '../utils/appEvents';
import type { JsonPathQueryItem } from '../utils/jsonPathQuery';
import { getStandaloneDeepFormatInputKind } from '../utils/transformations';

export type SettingsTab = 'shortcuts' | 'ai' | 'general';

interface JsonPathQueryRequest {
  id: number;
  query: string;
}

interface JsonTreeFocusRequest {
  id: number;
  path: string;
  pointer: string;
}

interface SchemeInputRequest {
  id: number;
  value: string;
}

interface TemplateFillRequest {
  id: number;
  template: string;
}

type TrackPanelEvent = (eventName: string, category: string) => void;

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
  const [jsonPathQueryRequest, setJsonPathQueryRequest] = useState<JsonPathQueryRequest | null>(null);
  const [jsonTreeFocusRequest, setJsonTreeFocusRequest] = useState<JsonTreeFocusRequest | null>(null);
  const [schemeInputRequest, setSchemeInputRequest] = useState<SchemeInputRequest | null>(null);
  const [templateFillRequest, setTemplateFillRequest] = useState<TemplateFillRequest | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab>('shortcuts');
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState(false);
  const [changelogSourceMarkdown, setChangelogSourceMarkdown] = useState<string | null>(null);
  const [changelogHighlightedVersion, setChangelogHighlightedVersion] = useState<string | null>(null);
  const [isSchemeDecodeOpen, setIsSchemeDecodeOpen] = useState(false);
  const [isTemplatePanelOpen, setIsTemplatePanelOpen] = useState(false);
  const [templateApplyQualityDelta, setTemplateApplyQualityDelta] = useState('');
  const [isTransformReportOpen, setIsTransformReportOpen] = useState(false);
  const jsonPathQueryRequestIdRef = useRef(0);
  const jsonTreeFocusRequestIdRef = useRef(0);
  const schemeInputRequestIdRef = useRef(0);
  const templateFillRequestIdRef = useRef(0);

  const requestSchemeInput = useCallback((value: string) => {
    setSchemeInputRequest({
      id: ++schemeInputRequestIdRef.current,
      value,
    });
  }, []);

  const handleToggleJsonPath = useCallback(() => {
    const nextOpen = !isJsonPathPanelOpen;
    if (nextOpen && mode !== TransformMode.DEEP_FORMAT) {
      onSetMode(TransformMode.DEEP_FORMAT);
    }
    setIsJsonPathPanelOpen(nextOpen);
    onTrackToolEvent(nextOpen ? 'JSONPATH_OPEN' : 'JSONPATH_CLOSE', 'panel');
  }, [isJsonPathPanelOpen, mode, onSetMode, onTrackToolEvent]);

  const handleToggleJsonTree = useCallback(() => {
    const nextOpen = !isJsonTreePanelOpen;
    if (nextOpen && mode !== TransformMode.DEEP_FORMAT) {
      onSetMode(TransformMode.DEEP_FORMAT);
    }
    setIsJsonTreePanelOpen(nextOpen);
    onTrackToolEvent(nextOpen ? 'STRUCTURE_NAV_OPEN' : 'STRUCTURE_NAV_CLOSE', 'panel');
  }, [isJsonTreePanelOpen, mode, onSetMode, onTrackToolEvent]);

  const handleToggleJsonCompare = useCallback(() => {
    const nextOpen = !isJsonComparePanelOpen;
    setIsJsonComparePanelOpen(nextOpen);
    onTrackToolEvent(nextOpen ? 'JSON_COMPARE_OPEN' : 'JSON_COMPARE_CLOSE', 'panel');
  }, [isJsonComparePanelOpen, onTrackToolEvent]);

  const handleToggleJsonSchema = useCallback(() => {
    const nextOpen = !isJsonSchemaPanelOpen;
    setIsJsonSchemaPanelOpen(nextOpen);
    onTrackToolEvent(nextOpen ? 'SCHEMA_PANEL_OPEN' : 'SCHEMA_PANEL_CLOSE', 'panel');
  }, [isJsonSchemaPanelOpen, onTrackToolEvent]);

  const handleToggleSchemeDecode = useCallback(() => {
    const nextOpen = !isSchemeDecodeOpen;
    setIsSchemeDecodeOpen(nextOpen);
    onTrackToolEvent(nextOpen ? 'SCHEME_PANEL_OPEN' : 'SCHEME_PANEL_CLOSE', 'panel');
  }, [isSchemeDecodeOpen, onTrackToolEvent]);

  const handleToggleTemplateFill = useCallback(() => {
    const nextOpen = !isTemplatePanelOpen;
    setTemplateApplyQualityDelta('');
    setIsTemplatePanelOpen(nextOpen);
    onTrackToolEvent(nextOpen ? 'TEMPLATE_PANEL_OPEN' : 'TEMPLATE_PANEL_CLOSE', 'panel');
  }, [isTemplatePanelOpen, onTrackToolEvent]);

  const handleOpenSettingsPanel = useCallback(() => {
    setSettingsInitialTab('shortcuts');
    setIsSettingsModalOpen(true);
    onTrackToolEvent('SETTINGS_OPEN', 'panel');
  }, [onTrackToolEvent]);

  const handleOpenAiSettings = useCallback(() => {
    setSettingsInitialTab('ai');
    setIsSettingsModalOpen(true);
  }, []);

  const handleLocateJsonPath = useCallback((query: string) => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;

    if (mode !== TransformMode.DEEP_FORMAT) {
      onSetMode(TransformMode.DEEP_FORMAT);
    }

    onSetHighlightRange(null);
    setJsonPathQueryRequest({
      id: ++jsonPathQueryRequestIdRef.current,
      query: normalizedQuery,
    });
    setIsJsonPathPanelOpen(true);
    setIsTransformReportOpen(false);
    onTrackToolEvent('JSONPATH_LOCATE', 'panel');
  }, [mode, onSetHighlightRange, onSetMode, onTrackToolEvent]);

  const handleLocateJsonPathResultInStructure = useCallback((item: JsonPathQueryItem) => {
    setJsonTreeFocusRequest({
      id: ++jsonTreeFocusRequestIdRef.current,
      path: item.path,
      pointer: item.pointer,
    });
    setIsJsonTreePanelOpen(true);
    setIsTransformReportOpen(false);
    onTrackToolEvent('STRUCTURE_NAV_LOCATE', 'panel');
  }, [onTrackToolEvent]);

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
    const value = sourceText.trim();
    if (!value || !getStandaloneDeepFormatInputKind(value)) return;

    handleOpenSchemeFromSourceStatus(value);
  }, [handleOpenSchemeFromSourceStatus, sourceText]);

  const handleOpenChangelog = useCallback((detail?: AppChangelogOpenDetail) => {
    setChangelogSourceMarkdown(detail?.changelogMarkdown?.trim() ? detail.changelogMarkdown : null);
    setChangelogHighlightedVersion(detail?.version || null);
    setIsChangelogModalOpen(true);
  }, []);

  const handleCloseChangelog = useCallback(() => {
    setIsChangelogModalOpen(false);
  }, []);

  useEffect(() => {
    const handleChangelogOpen = (event: Event) => {
      const detail = event instanceof CustomEvent
        ? event.detail as AppChangelogOpenDetail | undefined
        : undefined;
      handleOpenChangelog(detail);
    };

    window.addEventListener(APP_CHANGELOG_OPEN_EVENT, handleChangelogOpen);
    return () => window.removeEventListener(APP_CHANGELOG_OPEN_EVENT, handleChangelogOpen);
  }, [handleOpenChangelog]);

  const handleOpenTemplateFillFromReport = useCallback((template: string) => {
    if (!template) return;

    setTemplateApplyQualityDelta('');
    setTemplateFillRequest({
      id: ++templateFillRequestIdRef.current,
      template,
    });
    setIsTemplatePanelOpen(true);
    setIsTransformReportOpen(false);
    onTrackToolEvent('TEMPLATE_OPEN_FROM_REPORT', 'panel');
  }, [onTrackToolEvent]);

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
