import { readExistingFile } from './aiGovernanceProjectVersionFactSources.mjs';

const findVersionMentions = (content, prefix) => {
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...content.matchAll(new RegExp(`${escapedPrefix}(\\d+)`, 'g'))].map(match => match[1]);
};

export const collectTargetFailures = (rootDir, fact, major) => fact.targets.flatMap(([file, prefix]) => {
  const content = readExistingFile(rootDir, file);
  if (content === null) return [];

  const expected = `${prefix}${major}`;
  const missing = content.includes(expected) ? [] : [`${file}: ${fact.name} 版本事实缺少 "${expected}"`];
  const stale = [...new Set(findVersionMentions(content, prefix))]
    .filter(value => value !== major)
    .map(value => `${file}: ${fact.name} 版本事实包含过期主版本 "${value}"`);
  return [...missing, ...stale];
});

export const collectUnverifiableVersionFactFailures = (rootDir, facts) => facts.flatMap(({ file, snippet, message }) => {
  const content = readExistingFile(rootDir, file);
  return content?.includes(snippet) ? [message] : [];
});
