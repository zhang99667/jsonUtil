import { useCallback, useEffect, useState } from 'react';
import { APP_CHANGELOG_OPEN_EVENT, type AppChangelogOpenDetail } from '../utils/appEvents';
import { buildChangelogOpenState } from '../utils/appToolPanelCommandPlans';

export const useAppChangelogCommands = () => {
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState(false);
  const [changelogSourceMarkdown, setChangelogSourceMarkdown] = useState<string | null>(null);
  const [changelogHighlightedVersion, setChangelogHighlightedVersion] = useState<string | null>(null);

  const handleOpenChangelog = useCallback((detail?: AppChangelogOpenDetail) => {
    const state = buildChangelogOpenState(detail);
    setChangelogSourceMarkdown(state.sourceMarkdown);
    setChangelogHighlightedVersion(state.highlightedVersion);
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

  return {
    changelogHighlightedVersion,
    changelogSourceMarkdown,
    handleCloseChangelog,
    handleOpenChangelog,
    isChangelogModalOpen,
  };
};
