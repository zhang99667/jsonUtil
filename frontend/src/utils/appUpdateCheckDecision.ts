import {
  type AppVersionManifest,
  isRemoteAppVersionNewer,
} from './appVersion';

interface AppUpdateCheckReadinessInput {
  isActive: boolean;
  visibilityState: DocumentVisibilityState;
}

interface AppUpdateNotificationInput {
  currentVersion: string;
  manifest: AppVersionManifest | null;
  notifiedVersion: string | null;
}

export const shouldRunAppUpdateCheck = ({
  isActive,
  visibilityState,
}: AppUpdateCheckReadinessInput): boolean => (
  isActive && visibilityState !== 'hidden'
);

export const shouldNotifyAppUpdate = ({
  currentVersion,
  manifest,
  notifiedVersion,
}: AppUpdateNotificationInput): boolean => {
  if (!manifest) return false;
  if (!isRemoteAppVersionNewer(currentVersion, manifest.version)) return false;
  return notifiedVersion !== manifest.version;
};
