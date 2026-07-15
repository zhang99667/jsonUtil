import path from 'node:path';

import { captureProjectPluginTree } from './aiGovernanceProjectPluginTreeSnapshot.mjs';

const FORBIDDEN_SOURCE_PATTERNS = [
  /(?:^|[\s"'`=(])(?:file:\/\/)?\/(?:Users|home)\//m,
  /(?:^|[\s"'`=(])(?:file:\/\/\/?)?[A-Za-z]:\\Users\\/m,
  /Local developer/,
  /personal-plugin-unverified/,
  /Personal Codex plugin/,
  /Personal, local-only/,
];
const identityViews = content => [
  content,
  content.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replaceAll('\\/', '/').replaceAll('\\\\', '\\'),
];

export const collectProjectPluginSourceIdentityFailures = (rootDir, { sourceSnapshot } = {}) => {
  let snapshot = sourceSnapshot;
  try { snapshot ??= captureProjectPluginTree(rootDir); }
  catch { return ['plugins/: 项目插件完整源码树必须可读、无 symlink 且 manifest 合法']; }

  const failures = [];
  for (const plugin of snapshot.plugins) for (const entry of plugin.files) {
    const file = path.posix.join(plugin.source, entry.path);
    const views = identityViews(entry.content.toString('utf8'));
    if (FORBIDDEN_SOURCE_PATTERNS.some(pattern => views.some(content => pattern.test(content)))) {
      failures.push(`${file}: 项目插件不得使用个人权威身份或绝对用户路径`);
    }
  }
  return failures;
};
