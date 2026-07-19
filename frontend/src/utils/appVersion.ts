import { compareVersions, validateStrict } from 'compare-versions';
import { isRecord } from './storage';

export interface AppVersionMetadata {
  name: 'JSONUtils';
  version: string;
  versionLabel: string;
}

export interface AppVersionManifest {
  name: 'JSONUtils';
  version: string;
  versionLabel: string;
  builtAt?: string;
  changelogMarkdown?: string;
}

export const VERSION_MANIFEST_PATH = '/version.json';

export const normalizeAppVersion = (version?: string): string => {
  const trimmedVersion = version?.trim();
  if (!trimmedVersion) return '0.0.0';

  const normalizedVersion = trimmedVersion.startsWith('v')
    ? trimmedVersion.slice(1)
    : trimmedVersion;
  return validateStrict(normalizedVersion) ? normalizedVersion : '0.0.0';
};

export const compareAppVersions = (leftVersion: string, rightVersion: string): number => (
  compareVersions(normalizeAppVersion(leftVersion), normalizeAppVersion(rightVersion))
);

export const isRemoteAppVersionNewer = (currentVersion: string, remoteVersion: string): boolean => (
  compareAppVersions(remoteVersion, currentVersion) > 0
);

export const parseAppVersionManifest = (value: unknown): AppVersionManifest | null => {
  if (!isRecord(value) || typeof value.version !== 'string') return null;

  const version = normalizeAppVersion(value.version);
  if (!version || version === '0.0.0') return null;

  const changelogMarkdown = typeof value.changelogMarkdown === 'string' && value.changelogMarkdown.trim()
    ? value.changelogMarkdown
    : undefined;

  return {
    name: 'JSONUtils',
    version,
    versionLabel: `v${version}`,
    ...(typeof value.builtAt === 'string' ? { builtAt: value.builtAt } : {}),
    ...(changelogMarkdown ? { changelogMarkdown } : {}),
  };
};

export const getAppVersionManifestUrl = (now: number = Date.now()): string => (
  `${VERSION_MANIFEST_PATH}?t=${now}`
);

export const APP_VERSION = normalizeAppVersion(import.meta.env.VITE_APP_VERSION);
export const APP_VERSION_LABEL = `v${APP_VERSION}`;

export const APP_VERSION_METADATA: AppVersionMetadata = {
  name: 'JSONUtils',
  version: APP_VERSION,
  versionLabel: APP_VERSION_LABEL,
};
