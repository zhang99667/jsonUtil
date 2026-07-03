import { useCallback, useState } from 'react';
import type { TransformMode, HighlightRange } from '../types';
import { useAppChangelogCommands } from './useAppChangelogCommands';
import { useAppSettingsModalCommands } from './useAppSettingsModalCommands';
import { useAppToolPanelActionCommands } from './useAppToolPanelActionCommands';
import { useAppToolPanelRequestCommands } from './useAppToolPanelRequestCommands';
import { useAppToolPanelToggleHandlers } from './useAppToolPanelToggleHandlers';

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
  const panelRequests = useAppToolPanelRequestCommands();
  const settingsCommands = useAppSettingsModalCommands({ onTrackToolEvent });
  const changelogCommands = useAppChangelogCommands();
  const [isSchemeDecodeOpen, setIsSchemeDecodeOpen] = useState(false);
  const [isTemplatePanelOpen, setIsTemplatePanelOpen] = useState(false);
  const [templateApplyQualityDelta, setTemplateApplyQualityDelta] = useState('');
  const [isTransformReportOpen, setIsTransformReportOpen] = useState(false);

  const closeTransformReportPanel = useCallback(() => setIsTransformReportOpen(false), []);

  const toggleHandlers = useAppToolPanelToggleHandlers({
    mode,
    isJsonPathPanelOpen,
    isJsonTreePanelOpen,
    isJsonComparePanelOpen,
    isJsonSchemaPanelOpen,
    isSchemeDecodeOpen,
    isTemplatePanelOpen,
    onSetMode,
    onSetJsonPathPanelOpen: setIsJsonPathPanelOpen,
    onSetJsonTreePanelOpen: setIsJsonTreePanelOpen,
    onSetJsonComparePanelOpen: setIsJsonComparePanelOpen,
    onSetJsonSchemaPanelOpen: setIsJsonSchemaPanelOpen,
    onSetSchemeDecodeOpen: setIsSchemeDecodeOpen,
    onSetTemplatePanelOpen: setIsTemplatePanelOpen,
    onClearTemplateApplyQualityDelta: () => setTemplateApplyQualityDelta(''),
    onTrackToolEvent,
  });

  const actionCommands = useAppToolPanelActionCommands({
    closeTransformReportPanel,
    mode,
    onSetHighlightRange,
    onSetMode,
    onTrackToolEvent,
    requestJsonPathQuery: panelRequests.requestJsonPathQuery,
    requestJsonTreeFocus: panelRequests.requestJsonTreeFocus,
    requestSchemeInput: panelRequests.requestSchemeInput,
    requestTemplateFill: panelRequests.requestTemplateFill,
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
    ...changelogCommands,
    handleCloseJsonPathPanel,
    ...actionCommands,
    ...settingsCommands,
    ...toggleHandlers,
    isJsonComparePanelOpen,
    isJsonPathPanelOpen,
    isJsonSchemaPanelOpen,
    isJsonTreePanelOpen,
    isSchemeDecodeOpen,
    isTemplatePanelOpen,
    isTransformReportOpen,
    setIsJsonComparePanelOpen,
    setIsJsonPathPanelOpen,
    setIsJsonSchemaPanelOpen,
    setIsJsonTreePanelOpen,
    setIsSchemeDecodeOpen,
    setIsTemplatePanelOpen,
    setIsTransformReportOpen,
    setTemplateApplyQualityDelta,
    templateApplyQualityDelta,
    ...panelRequests,
  };
};
