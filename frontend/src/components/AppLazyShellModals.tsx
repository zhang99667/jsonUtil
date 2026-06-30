import React, { Suspense, type ComponentProps } from 'react';
import {
  LazyChangelogModal,
  LazyUnifiedSettingsModal,
} from './appLazyPanels';
import type { AppLazyPanelLoadState } from '../utils/appLazyPanelLoadState';

type SettingsModalProps = ComponentProps<typeof LazyUnifiedSettingsModal>;
type ChangelogModalProps = ComponentProps<typeof LazyChangelogModal>;

interface AppLazyShellModalsProps {
  lazyPanelsLoaded: Pick<AppLazyPanelLoadState, 'settings' | 'changelog'>;
  settingsModal: SettingsModalProps;
  changelogModal: ChangelogModalProps;
}

export const AppLazyShellModals: React.FC<AppLazyShellModalsProps> = ({
  lazyPanelsLoaded,
  settingsModal,
  changelogModal,
}) => (
  <>
    {lazyPanelsLoaded.settings && (
      <Suspense fallback={null}>
        <LazyUnifiedSettingsModal {...settingsModal} />
      </Suspense>
    )}

    {lazyPanelsLoaded.changelog && (
      <Suspense fallback={null}>
        <LazyChangelogModal {...changelogModal} />
      </Suspense>
    )}
  </>
);
