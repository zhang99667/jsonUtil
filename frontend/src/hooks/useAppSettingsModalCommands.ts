import { useCallback, useState } from 'react';

export type SettingsTab = 'shortcuts' | 'ai' | 'general';

type TrackPanelEvent = (eventName: string, category: string) => void;

interface UseAppSettingsModalCommandsInput {
  onTrackToolEvent: TrackPanelEvent;
}

export const useAppSettingsModalCommands = ({
  onTrackToolEvent,
}: UseAppSettingsModalCommandsInput) => {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab>('shortcuts');

  const handleOpenSettingsPanel = useCallback(() => {
    setSettingsInitialTab('shortcuts');
    setIsSettingsModalOpen(true);
    onTrackToolEvent('SETTINGS_OPEN', 'panel');
  }, [onTrackToolEvent]);

  const handleOpenAiSettings = useCallback(() => {
    setSettingsInitialTab('ai');
    setIsSettingsModalOpen(true);
  }, []);

  return {
    handleOpenAiSettings,
    handleOpenSettingsPanel,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    settingsInitialTab,
  };
};
