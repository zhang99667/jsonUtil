import { useCallback, useState } from 'react';
import { TransformMode, type HighlightRange } from '../types';
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

  const {
    handleToggleJsonCompare,
    handleToggleJsonPath,
    handleToggleJsonSchema,
    handleToggleJsonTree,
    handleToggleSchemeDecode,
    handleToggleTemplateFill,
  } = useAppToolPanelToggleHandlers({
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
