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

  if (!trimmedVersion.startsWith('v')) return trimmedVersion;

  const withoutPrefix = trimmedVersion.slice(1).trim();
  return withoutPrefix || '0.0.0';
};

const getVersionCore = (version: string): string => (
  normalizeAppVersion(version).split(/[+-]/)[0]
);

const parseVersionSegments = (version: string): number[] | null => {
  const core = getVersionCore(version);
  if (!/^\d+(?:\.\d+)*$/.test(core)) return null;

  return core.split('.').map(segment => Number(segment));
};

export const compareAppVersions = (leftVersion: string, rightVersion: string): number => {
  const leftSegments = parseVersionSegments(leftVersion);
  const rightSegments = parseVersionSegments(rightVersion);

  if (!leftSegments || !rightSegments) {
    const left = normalizeAppVersion(leftVersion);
    const right = normalizeAppVersion(rightVersion);
    if (left === right) return 0;
    return left > right ? 1 : -1;
  }

  const maxLength = Math.max(leftSegments.length, rightSegments.length);
  for (let index = 0; index < maxLength; index++) {
    const left = leftSegments[index] || 0;
    const right = rightSegments[index] || 0;
    if (left !== right) return left > right ? 1 : -1;
  }

  return 0;
};

export const isRemoteAppVersionNewer = (currentVersion: string, remoteVersion: string): boolean => (
  compareAppVersions(remoteVersion, currentVersion) > 0
);

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
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
