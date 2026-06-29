import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

export interface VersionManifest {
  name: 'JSONUtils';
  version: string;
  versionLabel: string;
  builtAt: string;
  changelogMarkdown: string;
}

export interface VersionManifestOptions {
  version?: string;
  changelogMarkdown?: string;
  builtAt?: string;
  changelogLimit?: number;
}

export interface VersionManifestPluginOptions extends VersionManifestOptions {
  getBuiltAt?: () => string;
}

export const readTextFileSafely = (fileUrl: URL): string => {
  try {
    return readFileSync(fileUrl, 'utf-8');
  } catch {
    return '';
  }
};

export const readJsonFile = <T>(fileUrl: URL): T => (
  JSON.parse(readFileSync(fileUrl, 'utf-8')) as T
);

export const extractRecentChangelogMarkdown = (markdown: string, limit = 8): string => {
  const lines: string[] = [];
  let entryCount = 0;
  let hasStarted = false;

  for (const line of markdown.split(/\r?\n/)) {
    if (line.startsWith('## ')) {
      entryCount++;
      if (entryCount > limit) break;
      hasStarted = true;
    }

    if (hasStarted) {
      lines.push(line);
    }
  }

  return lines.join('\n').trim();
};

export const createVersionManifest = ({
  version = '0.0.0',
  changelogMarkdown = '',
  builtAt = new Date().toISOString(),
  changelogLimit = 8,
}: VersionManifestOptions): VersionManifest => ({
  name: 'JSONUtils',
  version,
  versionLabel: `v${version}`,
  builtAt,
  changelogMarkdown: extractRecentChangelogMarkdown(changelogMarkdown, changelogLimit),
});

export const createVersionManifestAssetSource = ({
  getBuiltAt,
  ...options
}: VersionManifestPluginOptions): string => (
  JSON.stringify(createVersionManifest({
    ...options,
    builtAt: options.builtAt || getBuiltAt?.(),
  }), null, 2)
);

export const createVersionManifestPlugin = (options: VersionManifestPluginOptions): Plugin => ({
  name: 'json-helper-version-manifest',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: createVersionManifestAssetSource(options),
    });
  },
});
