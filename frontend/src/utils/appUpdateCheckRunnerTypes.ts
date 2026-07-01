import type { AppVersionManifest } from './appVersion';

export interface RunAppUpdateCheckOnceInput {
  notifiedVersion: string | null;
  fetchManifest: () => Promise<unknown>;
  getIsActive: () => boolean;
  getVisibilityState: () => DocumentVisibilityState;
  onNotify: (manifest: AppVersionManifest) => void;
  onNotifiedVersionChange: (version: string) => void;
  currentVersion?: string;
}
