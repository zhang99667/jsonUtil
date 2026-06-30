import { APP_VERSION, parseAppVersionManifest } from './appVersion';
import {
  shouldNotifyAppUpdate,
  shouldRunAppUpdateCheck,
} from './appUpdateCheckDecision';
import type { AppVersionManifest } from './appVersion';

interface RunAppUpdateCheckOnceInput {
  notifiedVersion: string | null;
  fetchManifest: () => Promise<unknown>;
  getIsActive: () => boolean;
  getVisibilityState: () => DocumentVisibilityState;
  onNotify: (manifest: AppVersionManifest) => void;
  onNotifiedVersionChange: (version: string) => void;
  currentVersion?: string;
}

const canRunAppUpdateCheck = (
  getIsActive: () => boolean,
  getVisibilityState: () => DocumentVisibilityState
): boolean => shouldRunAppUpdateCheck({
  isActive: getIsActive(),
  visibilityState: getVisibilityState(),
});

export const runAppUpdateCheckOnce = async ({
  notifiedVersion,
  fetchManifest,
  getIsActive,
  getVisibilityState,
  onNotify,
  onNotifiedVersionChange,
  currentVersion = APP_VERSION,
}: RunAppUpdateCheckOnceInput): Promise<void> => {
  if (!canRunAppUpdateCheck(getIsActive, getVisibilityState)) return;

  try {
    const manifestValue = await fetchManifest();
    if (!canRunAppUpdateCheck(getIsActive, getVisibilityState)) return;

    const manifest = parseAppVersionManifest(manifestValue);
    if (!shouldNotifyAppUpdate({
      currentVersion,
      manifest,
      notifiedVersion,
    })) return;

    onNotifiedVersionChange(manifest.version);
    onNotify(manifest);
  } catch {
    // 版本检查失败不影响主流程，下一轮可自动重试。
  }
};
