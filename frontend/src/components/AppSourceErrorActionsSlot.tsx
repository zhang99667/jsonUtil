import React from 'react';
import { SourceEditorErrorActions } from './SourceEditorErrorActions';
import type { ValidationResult } from '../types';

interface AppSourceErrorActionsSlotProps {
  sourceValidation: ValidationResult;
  hasSourceContent: boolean;
  repairTitle: string;
  isProcessing: boolean;
  onRepair: () => void;
}

export const AppSourceErrorActionsSlot: React.FC<AppSourceErrorActionsSlotProps> = ({
  sourceValidation,
  hasSourceContent,
  repairTitle,
  isProcessing,
  onRepair,
}) => {
  if (sourceValidation.isValid || !hasSourceContent) {
    return null;
  }

  return (
    <SourceEditorErrorActions
      repairTitle={repairTitle}
      isProcessing={isProcessing}
      onRepair={onRepair}
    />
  );
};
