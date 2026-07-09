import fs from 'node:fs';
import path from 'node:path';
import { UNVERIFIABLE_VERSION_FACTS, VERSION_FACTS } from './aiGovernanceProjectVersionFactRules.mjs';

const readExistingFile = (rootDir, file) => {
  const filePath = path.join(rootDir, file);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
};

const majorFromVersion = value => String(value ?? '').match(/\d+/)?.[0] ?? null;

const npmMajor = (content, packageName) => {
  const pkg = JSON.parse(content);
  return majorFromVersion(pkg.dependencies?.[packageName] ?? pkg.devDependencies?.[packageName]);
};

const packageLockMajor = (rootDir, packageName) => {
  const content = readExistingFile(rootDir, 'frontend/package-lock.json');
  return content && majorFromVersion(JSON.parse(content).packages?.[`node_modules/${packageName}`]?.version);
};

const springBootMajor = content => majorFromVersion(content.match(/<artifactId>spring-boot-starter-parent<\/artifactId>[\s\S]*?<version>([^<]+)<\/version>/)?.[1]);
const javaMajor = content => majorFromVersion(content.match(/<java\.version>([^<]+)<\/java\.version>/)?.[1]);
const sourceMajor = (content, fact) => ({
  javaMajor: () => javaMajor(content),
  npm: () => npmMajor(content, fact.packageName),
  springBootMajor: () => springBootMajor(content),
})[fact.sourceKind]?.() ?? null;

const findVersionMentions = (content, prefix) => {
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...content.matchAll(new RegExp(`${escapedPrefix}(\\d+)`, 'g'))].map(match => match[1]);
};

const collectTargetFailures = (rootDir, fact, major) => fact.targets.flatMap(([file, prefix]) => {
  const content = readExistingFile(rootDir, file);
  if (content === null) return [];

  const expected = `${prefix}${major}`;
  const missing = content.includes(expected) ? [] : [`${file}: ${fact.name} 版本事实缺少 "${expected}"`];
  const stale = [...new Set(findVersionMentions(content, prefix))]
    .filter(value => value !== major)
    .map(value => `${file}: ${fact.name} 版本事实包含过期主版本 "${value}"`);
  return [...missing, ...stale];
});

const collectUnverifiableVersionFactFailures = rootDir => UNVERIFIABLE_VERSION_FACTS.flatMap(({ file, snippet, message }) => {
  const content = readExistingFile(rootDir, file);
  return content?.includes(snippet) ? [message] : [];
});

export const collectAiGovernanceProjectVersionFactFailures = (rootDir) => VERSION_FACTS.flatMap((fact) => {
  const content = readExistingFile(rootDir, fact.sourceFile);
  if (content === null) return [];
  const major = sourceMajor(content, fact);
  if (major === null) return [];
  const lockMajor = fact.packageName ? packageLockMajor(rootDir, fact.packageName) : major;
  const lockFailures = lockMajor === major ? [] : [`frontend/package-lock.json: ${fact.name} 版本事实与 frontend/package.json 不一致，期望主版本 ${major}，实际 ${lockMajor ?? 'missing'}`];
  return [...lockFailures, ...collectTargetFailures(rootDir, fact, major)];
}).concat(collectUnverifiableVersionFactFailures(rootDir));
