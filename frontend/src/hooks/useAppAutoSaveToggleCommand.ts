import { useCallback } from 'react';
import { buildAppAutoSaveTogglePlan } from '../utils/appAutoSaveTogglePlan';
import { showError, showSuccess } from '../utils/toast';

interface UseAppAutoSaveToggleCommandInput {
  hasActiveFile: boolean;
  activeFileHasHandle: boolean;
  isAutoSaveEnabled: boolean;
  onSetAutoSaveEnabled: (nextEnabled: boolean) => void;
}

export const useAppAutoSaveToggleCommand = ({
  hasActiveFile,
  activeFileHasHandle,
  isAutoSaveEnabled,
  onSetAutoSaveEnabled,
}: UseAppAutoSaveToggleCommandInput) => {
  const handleToggleAutoSave = useCallback(() => {
    const plan = buildAppAutoSaveTogglePlan({
      hasActiveFile,
      activeFileHasHandle,
      isAutoSaveEnabled,
    });

    if (plan.type === 'error') {
      showError(plan.message);
      return;
    }

    onSetAutoSaveEnabled(plan.nextEnabled);
    showSuccess(plan.message);
  }, [activeFileHasHandle, hasActiveFile, isAutoSaveEnabled, onSetAutoSaveEnabled]);

  return { handleToggleAutoSave };
};
