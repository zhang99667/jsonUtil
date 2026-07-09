import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectAiGovernanceProjectFactFailures } from './aiGovernanceProjectFactsContract.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const writePostgreSqlSources = (rootDir) => {
  writeFixtureFile(rootDir, 'backend/src/main/resources/application.yml', 'jdbc:postgresql://localhost:5432/jsonhelper\norg.postgresql.Driver\nPostgreSQLDialect');
  writeFixtureFile(rootDir, 'backend/pom.xml', '<artifactId>postgresql</artifactId>');
  writeFixtureFile(rootDir, 'docker-compose.yml', 'image: postgres:16\nSPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/jsonhelper');
  writeFixtureFile(rootDir, 'docker-compose.local.yml', 'image: postgres:16\nSPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/jsonhelper');
};

const writePostgreSqlTargets = (rootDir) => {
  writeFixtureFile(rootDir, 'AGENTS.md', 'Spring Data JPA + PostgreSQL');
  writeFixtureFile(rootDir, 'CLAUDE.md', 'Spring Data JPA + PostgreSQL');
  writeFixtureFile(rootDir, 'rules/code-style.md', '| 数据库 | PostgreSQL | - |');
};

test('AI 治理项目事实契约接受入口数据库事实与配置一致', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writePostgreSqlSources(rootDir);
    writePostgreSqlTargets(rootDir);

    assert.deepEqual(collectAiGovernanceProjectFactFailures(rootDir), []);
  });
});

test('AI 治理项目事实契约会报告入口数据库旧事实', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writePostgreSqlSources(rootDir);
    writePostgreSqlTargets(rootDir);
    writeFixtureFile(rootDir, 'AGENTS.md', 'Spring Data JPA + MySQL/H2\njdbc:mysql://localhost:3306/jsonhelper');

    assert.deepEqual(collectAiGovernanceProjectFactFailures(rootDir), [
      'AGENTS.md: 数据库事实缺少 "Spring Data JPA + PostgreSQL"',
      'AGENTS.md: 数据库事实包含过期片段 "MySQL"',
      'AGENTS.md: 数据库事实包含过期片段 "H2"',
    ]);
  });
});

test('AI 治理项目事实契约会报告数据库来源互相矛盾', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writePostgreSqlSources(rootDir);
    writeFixtureFile(rootDir, 'backend/pom.xml', '<artifactId>mysql-connector-j</artifactId>');
    writePostgreSqlTargets(rootDir);

    assert.deepEqual(collectAiGovernanceProjectFactFailures(rootDir), [
      '项目事实: 数据库来源不一致，backend/src/main/resources/application.yml=PostgreSQL, backend/pom.xml=MySQL, docker-compose.yml=PostgreSQL, docker-compose.local.yml=PostgreSQL',
    ]);
  });
});

test('AI 治理项目事实契约会报告部分数据库来源缺失', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writePostgreSqlTargets(rootDir);
    writeFixtureFile(rootDir, 'backend/pom.xml', '<artifactId>postgresql</artifactId>');
    assert.deepEqual(collectAiGovernanceProjectFactFailures(rootDir), [
      'backend/src/main/resources/application.yml: 无法识别数据库事实',
      'docker-compose.yml: 无法识别数据库事实',
      'docker-compose.local.yml: 无法识别数据库事实',
    ]);
  });
});
