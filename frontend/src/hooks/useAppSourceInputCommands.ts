import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { TransformMode } from '../types';
import type { AiRepairSummary } from '../utils/aiRepairSummary';
import { cleanJsonInput } from '../utils/jsonValidation';
import { isStandaloneDeepFormatInput } from '../utils/transformations';

interface UseAppSourceInputCommandsInput {
  sourceText: string;
  mode: TransformMode;
  inputRef: MutableRefObject<string>;
  onSetSourceText: (value: string) => void;
  onSetMode: (mode: TransformMode) => void;
  onSetSmartSuggestionOrigin: (value: null) => void;
  onUpdateActiveFileContent: (value: string) => void;
}

export const useAppSourceInputCommands = ({
  sourceText,
  mode,
  inputRef,
  onSetSourceText,
  onSetMode,
  onSetSmartSuggestionOrigin,
  onUpdateActiveFileContent,
}: UseAppSourceInputCommandsInput) => {
  const aiRepairSnapshotRef = useRef<string | null>(null);
  const [aiRepairSummary, setAiRepairSummary] = useState<AiRepairSummary | null>(null);

  const clearAiRepairSummary = useCallback(() => {
    aiRepairSnapshotRef.current = null;
    setAiRepairSummary(null);
  }, []);

  useEffect(() => {
    if (!aiRepairSummary) return;
    if (aiRepairSnapshotRef.current !== sourceText) {
      clearAiRepairSummary();
    }
  }, [aiRepairSummary, clearAiRepairSummary, sourceText]);

  const clearAiRepairSummaryForSource = useCallback((nextSourceText: string) => {
    if (aiRepairSnapshotRef.current !== nextSourceText) {
      clearAiRepairSummary();
    }
  }, [clearAiRepairSummary]);

  const handleInputChange = useCallback((nextValue: string) => {
    const cleanValue = cleanJsonInput(nextValue);
    onSetSmartSuggestionOrigin(null);
    clearAiRepairSummaryForSource(cleanValue);
    onSetSourceText(cleanValue);

    if (mode === TransformMode.NONE && isStandaloneDeepFormatInput(cleanValue)) {
      onSetMode(TransformMode.DEEP_FORMAT);
    }

    inputRef.current = cleanValue;
    onUpdateActiveFileContent(cleanValue);
  }, [
    clearAiRepairSummaryForSource,
    inputRef,
    mode,
    onSetMode,
    onSetSourceText,
    onSetSmartSuggestionOrigin,
    onUpdateActiveFileContent,
  ]);

  const handleApplyAiRepairResult = useCallback((fixedJson: string, summary: AiRepairSummary) => {
    aiRepairSnapshotRef.current = fixedJson;
    setAiRepairSummary(summary);
    onSetSourceText(fixedJson);
    inputRef.current = fixedJson;
    onUpdateActiveFileContent(fixedJson);
  }, [inputRef, onSetSourceText, onUpdateActiveFileContent]);

  return {
    aiRepairSnapshotRef,
    aiRepairSummary,
    handleApplyAiRepairResult,
    handleCloseAiRepairSummary: clearAiRepairSummary,
    handleInputChange,
  };
};
