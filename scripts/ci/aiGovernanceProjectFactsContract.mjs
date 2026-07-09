import fs from 'node:fs';
import path from 'node:path';
import { collectAiGovernanceProjectVersionFactFailures } from './aiGovernanceProjectVersionFactsContract.mjs';

const DATABASE_FACT_SOURCES = ['backend/src/main/resources/application.yml', 'backend/pom.xml', 'docker-compose.yml', 'docker-compose.local.yml'];

const DATABASE_FACT_TARGETS = [
  ['AGENTS.md', 'Spring Data JPA + '],
  ['CLAUDE.md', 'Spring Data JPA + '],
  ['rules/code-style.md', '| 数据库 | '],
];

const DATABASE_KINDS = [
  { kind: 'postgresql', display: 'PostgreSQL', patterns: [/jdbc:postgresql/i, /org\.postgresql/i, /PostgreSQLDialect/, /<artifactId>postgresql<\/artifactId>/i, /postgres:/i] },
  { kind: 'mysql', display: 'MySQL', patterns: [/jdbc:mysql/i, /com\.mysql/i, /mysql-connector/i, /MySQLDialect/, /mysql:/i] },
  { kind: 'h2', display: 'H2', patterns: [/jdbc:h2/i, /org\.h2/i, /H2Dialect/] },
];

const readExistingFile = (rootDir, file) => {
  const filePath = path.join(rootDir, file);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
};

const collectDatabaseKinds = content => DATABASE_KINDS
  .filter(({ patterns }) => patterns.some(pattern => pattern.test(content)))
  .map(({ kind }) => kind);

const unique = values => [...new Set(values)];

const displayDatabaseKind = kind => DATABASE_KINDS.find(item => item.kind === kind)?.display ?? kind;

const collectDatabaseFactSources = rootDir => DATABASE_FACT_SOURCES
  .map((file) => {
    const content = readExistingFile(rootDir, file);
    return { file, kinds: content === null ? null : unique(collectDatabaseKinds(content)) };
  });

const collectDatabaseSourceFailures = (sources) => {
  if (sources.every(({ kinds }) => kinds === null)) return [];

  const missing = sources
    .filter(({ kinds }) => kinds === null || kinds.length === 0)
    .map(({ file }) => `${file}: 无法识别数据库事实`);
  const kinds = unique(sources.flatMap(({ kinds }) => kinds ?? []));
  if (missing.length > 0 || kinds.length <= 1) return missing;

  const detail = sources
    .map(({ file, kinds: sourceKinds }) => `${file}=${sourceKinds.map(displayDatabaseKind).join('/') || 'unknown'}`)
    .join(', ');
  return [...missing, `项目事实: 数据库来源不一致，${detail}`];
};

const collectDatabaseTargetFailures = (rootDir, kind) => {
  const display = displayDatabaseKind(kind);
  const forbiddenDisplays = DATABASE_KINDS.filter(item => item.kind !== kind).map(({ display }) => display);

  return DATABASE_FACT_TARGETS.flatMap(([file, requiredPrefix]) => {
    const content = readExistingFile(rootDir, file);
    if (content === null) return [];

    const required = `${requiredPrefix}${display}`;
    const missing = content.includes(required) ? [] : [`${file}: 数据库事实缺少 "${required}"`];
    const forbidden = forbiddenDisplays
      .filter(value => content.includes(value))
      .map(value => `${file}: 数据库事实包含过期片段 "${value}"`);
    return [...missing, ...forbidden];
  });
};

export const collectAiGovernanceProjectFactFailures = (rootDir) => {
  const sources = collectDatabaseFactSources(rootDir);
  const sourceFailures = collectDatabaseSourceFailures(sources);
  const versionFailures = collectAiGovernanceProjectVersionFactFailures(rootDir);
  if (sourceFailures.length > 0 || sources.every(({ kinds }) => kinds === null)) {
    return [...sourceFailures, ...versionFailures];
  }

  const [databaseKind] = unique(sources.flatMap(({ kinds }) => kinds));
  return [...collectDatabaseTargetFailures(rootDir, databaseKind), ...versionFailures];
};
