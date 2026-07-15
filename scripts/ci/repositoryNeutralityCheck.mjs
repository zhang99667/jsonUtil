import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const MAX_TEXT_FILE_BYTES = 5 * 1024 * 1024;
const MARKER_CODE_POINTS = Object.freeze([
  [100, 117, 99, 99],
  [99, 111, 109, 97, 116, 101],
  [30334, 24230],
  [98, 97, 105, 100, 117],
  [100, 97, 116, 97, 112, 105, 108, 111, 116],
  [101, 114, 110, 105, 101],
  [25991, 24515],
  [110, 97, 100, 99, 111, 114, 101, 118, 101, 110, 100, 111, 114],
  [110, 97, 100, 114, 101, 110, 100, 101, 114],
  [101, 97, 115, 121, 98, 114, 111, 119, 115, 101],
  [99, 109, 97, 116, 99, 104],
]);

export const RESTRICTED_MARKERS = Object.freeze(
  MARKER_CODE_POINTS.map(codePoints => String.fromCodePoint(...codePoints).toLowerCase()),
);

export const findRestrictedMarkerIndex = value => {
  const normalized = String(value).toLowerCase();
  const compact = normalized.replace(/[\s"',]+/g, '');
  return RESTRICTED_MARKERS.findIndex(marker => normalized.includes(marker) || compact.includes(marker));
};

const git = (rootDir, args) => execFileSync('git', args, {
  cwd: rootDir,
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024,
});

const trackedPaths = rootDir => git(rootDir, ['ls-files', '-z'])
  .split('\0')
  .filter(Boolean);

const readTrackedText = (rootDir, relativePath) => {
  const absolutePath = path.join(rootDir, relativePath);
  const stat = fs.lstatSync(absolutePath);
  if (stat.isSymbolicLink()) {
    return fs.readlinkSync(absolutePath);
  }
  if (!stat.isFile() || stat.size > MAX_TEXT_FILE_BYTES) {
    return null;
  }
  const content = fs.readFileSync(absolutePath);
  return content.includes(0) ? null : content.toString('utf8');
};

const historyFailures = rootDir => git(rootDir, ['rev-list', 'HEAD'])
  .trim()
  .split('\n')
  .filter(Boolean)
  .flatMap(commit => {
    const markerIndex = findRestrictedMarkerIndex(git(rootDir, ['show', '-s', '--format=%B', commit]));
    return markerIndex < 0 ? [] : [`commit ${commit}: marker #${markerIndex + 1}`];
  });

export const collectRepositoryNeutralityFailures = (rootDir, { includeHistory = true } = {}) => {
  const failures = [];
  for (const relativePath of trackedPaths(rootDir)) {
    const pathMarkerIndex = findRestrictedMarkerIndex(relativePath);
    if (pathMarkerIndex >= 0) {
      failures.push(`path ${relativePath}: marker #${pathMarkerIndex + 1}`);
      continue;
    }
    const content = readTrackedText(rootDir, relativePath);
    const contentMarkerIndex = content === null ? -1 : findRestrictedMarkerIndex(content);
    if (contentMarkerIndex >= 0) {
      failures.push(`content ${relativePath}: marker #${contentMarkerIndex + 1}`);
    }
  }
  return includeHistory ? [...failures, ...historyFailures(rootDir)] : failures;
};
