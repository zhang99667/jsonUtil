import fs from 'node:fs';
import path from 'node:path';

const VERSION_FACTS = [
  { name: 'React', sourceFile: 'frontend/package.json', packageName: 'react', source: content => npmMajor(content, 'react'), targets: [['AGENTS.md', 'React '], ['CLAUDE.md', 'React '], ['rules/code-style.md', '| 框架 | React | ']] },
  { name: 'Vite', sourceFile: 'frontend/package.json', packageName: 'vite', source: content => npmMajor(content, 'vite'), targets: [['AGENTS.md', 'Vite '], ['CLAUDE.md', 'Vite '], ['rules/code-style.md', '| 构建工具 | Vite | ']] },
  { name: 'TypeScript', sourceFile: 'frontend/package.json', packageName: 'typescript', source: content => npmMajor(content, 'typescript'), targets: [['AGENTS.md', 'TypeScript '], ['CLAUDE.md', 'TypeScript '], ['rules/code-style.md', '| 语言 | TypeScript | ']] },
  { name: 'Tailwind CSS', sourceFile: 'frontend/package.json', packageName: 'tailwindcss', source: content => npmMajor(content, 'tailwindcss'), targets: [['AGENTS.md', 'Tailwind CSS '], ['CLAUDE.md', 'Tailwind CSS '], ['rules/code-style.md', '| UI 组件库 | Tailwind CSS | ']] },
  { name: 'Spring Boot', sourceFile: 'backend/pom.xml', source: content => springBootMajor(content), targets: [['AGENTS.md', 'Spring Boot '], ['CLAUDE.md', 'Spring Boot '], ['rules/code-style.md', '| 框架 | Spring Boot | ']] },
  { name: 'Java', sourceFile: 'backend/pom.xml', source: content => javaMajor(content), targets: [['AGENTS.md', 'Java '], ['CLAUDE.md', 'Java '], ['rules/code-style.md', '| 语言 | Java | ']] },
];

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
  return content === null
    ? null
    : majorFromVersion(JSON.parse(content).packages?.[`node_modules/${packageName}`]?.version);
};

const springBootMajor = content => majorFromVersion(content.match(/<artifactId>spring-boot-starter-parent<\/artifactId>[\s\S]*?<version>([^<]+)<\/version>/)?.[1]);

const javaMajor = content => majorFromVersion(content.match(/<java\.version>([^<]+)<\/java\.version>/)?.[1]);

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

const collectLockFailures = (rootDir, fact, major) => {
  if (!fact.packageName) return [];
  const lockMajor = packageLockMajor(rootDir, fact.packageName);
  if (lockMajor === major) return [];
  return [`frontend/package-lock.json: ${fact.name} 版本事实与 frontend/package.json 不一致，期望主版本 ${major}，实际 ${lockMajor ?? 'missing'}`];
};
export const collectAiGovernanceProjectVersionFactFailures = (rootDir) => VERSION_FACTS.flatMap((fact) => {
  const content = readExistingFile(rootDir, fact.sourceFile);
  if (content === null) return [];
  const major = fact.source(content);
  if (major === null) return [];
  return [...collectLockFailures(rootDir, fact, major), ...collectTargetFailures(rootDir, fact, major)];
});
