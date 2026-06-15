export interface AppVersionMetadata {
  name: 'JSONUtils';
  version: string;
  versionLabel: string;
}

const normalizeAppVersion = (version?: string): string => {
  const trimmedVersion = version?.trim();
  if (!trimmedVersion) return '0.0.0';

  if (!trimmedVersion.startsWith('v')) return trimmedVersion;

  const withoutPrefix = trimmedVersion.slice(1).trim();
  return withoutPrefix || '0.0.0';
};

export const APP_VERSION = normalizeAppVersion(import.meta.env.VITE_APP_VERSION);
export const APP_VERSION_LABEL = `v${APP_VERSION}`;

export const APP_VERSION_METADATA: AppVersionMetadata = {
  name: 'JSONUtils',
  version: APP_VERSION,
  versionLabel: APP_VERSION_LABEL,
};
