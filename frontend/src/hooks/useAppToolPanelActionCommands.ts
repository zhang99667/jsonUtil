import { useCallback } from 'react';
import { TransformMode, type HighlightRange } from '../types';
import {
  getStandaloneSourceSchemeValue,
  type JsonPathQueryRequest,
  type JsonTreeFocusRequest,
  type SchemeInputRequest,
  type TemplateFillRequest,
} from '../utils/appToolPanelCommandPlans';
import type { JsonPathQueryItem } from '../utils/jsonPathQuery';

type TrackPanelEvent = (eventName: string, category: string) => void;
type SetPanelOpen = (isOpen: boolean) => void;

interface UseAppToolPanelActionCommandsInput {
  closeTransformReportPanel: () => void;
  mode: TransformMode;
  onSetHighlightRange: (range: HighlightRange | null) => void;
  onSetMode: (mode: TransformMode) => void;
  onTrackToolEvent: TrackPanelEvent;
  requestJsonPathQuery: (query: string) => JsonPathQueryRequest | null;
  requestJsonTreeFocus: (item: JsonPathQueryItem) => JsonTreeFocusRequest;
  requestSchemeInput: (value: string) => SchemeInputRequest;
  requestTemplateFill: (template: string) => TemplateFillRequest | null;
  setIsJsonPathPanelOpen: SetPanelOpen;
  setIsJsonTreePanelOpen: SetPanelOpen;
  setIsSchemeDecodeOpen: SetPanelOpen;
  setIsTemplatePanelOpen: SetPanelOpen;
  setTemplateApplyQualityDelta: (value: string) => void;
  sourceText: string;
}

export const useAppToolPanelActionCommands = ({
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
}: UseAppToolPanelActionCommandsInput) => {
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
  }, [
    closeTransformReportPanel,
    mode,
    onSetHighlightRange,
    onSetMode,
    onTrackToolEvent,
    requestJsonPathQuery,
    setIsJsonPathPanelOpen,
  ]);

  const handleLocateJsonPathResultInStructure = useCallback((item: JsonPathQueryItem) => {
    requestJsonTreeFocus(item);
    setIsJsonTreePanelOpen(true);
    closeTransformReportPanel();
    onTrackToolEvent('STRUCTURE_NAV_LOCATE', 'panel');
  }, [closeTransformReportPanel, onTrackToolEvent, requestJsonTreeFocus, setIsJsonTreePanelOpen]);

  const openStandaloneSchemePanel = useCallback((value: string, eventName: string) => {
    if (!value) return;

    requestSchemeInput(value);
    setIsSchemeDecodeOpen(true);
    closeTransformReportPanel();
    onTrackToolEvent(eventName, 'panel');
  }, [closeTransformReportPanel, onTrackToolEvent, requestSchemeInput, setIsSchemeDecodeOpen]);

  const handleOpenSchemeFromReport = useCallback((value: string) => {
    openStandaloneSchemePanel(value, 'SCHEME_OPEN_FROM_REPORT');
  }, [openStandaloneSchemePanel]);

  const handleOpenSchemeFromStructure = useCallback((value: string) => {
    openStandaloneSchemePanel(value, 'SCHEME_OPEN_FROM_STRUCTURE');
    setIsJsonTreePanelOpen(false);
  }, [openStandaloneSchemePanel, setIsJsonTreePanelOpen]);

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
  }, [
    closeTransformReportPanel,
    onTrackToolEvent,
    requestTemplateFill,
    setIsTemplatePanelOpen,
    setTemplateApplyQualityDelta,
  ]);

  return {
    handleLocateJsonPath,
    handleLocateJsonPathResultInStructure,
    handleOpenSchemeFromReport,
    handleOpenSchemeFromSourceStatus,
    handleOpenSchemeFromStructure,
    handleOpenSourceSchemeInput,
    handleOpenTemplateFillFromReport,
  };
};
