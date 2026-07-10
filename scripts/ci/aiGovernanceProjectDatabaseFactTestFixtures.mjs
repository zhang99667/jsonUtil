import { writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

export const writePostgreSqlSources = (rootDir) => {
  writeFixtureFile(rootDir, 'backend/src/main/resources/application.yml', 'jdbc:postgresql://localhost:5432/jsonhelper\norg.postgresql.Driver\nPostgreSQLDialect');
  writeFixtureFile(rootDir, 'backend/pom.xml', '<artifactId>postgresql</artifactId>');
  writeFixtureFile(rootDir, 'docker-compose.yml', 'image: postgres:16\nSPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/jsonhelper');
  writeFixtureFile(rootDir, 'docker-compose.local.yml', 'image: postgres:16\nSPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/jsonhelper');
};

export const writePostgreSqlTargets = (rootDir) => {
  writeFixtureFile(rootDir, 'AGENTS.md', 'Spring Data JPA + PostgreSQL');
  writeFixtureFile(rootDir, 'CLAUDE.md', 'Spring Data JPA + PostgreSQL');
  writeFixtureFile(rootDir, 'rules/code-style.md', '| 数据库 | PostgreSQL | - |');
};
