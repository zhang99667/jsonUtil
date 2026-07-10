export const DATABASE_FACT_SOURCES = [
  'backend/src/main/resources/application.yml',
  'backend/pom.xml',
  'docker-compose.yml',
  'docker-compose.local.yml',
];

export const DATABASE_FACT_TARGETS = [
  ['AGENTS.md', 'Spring Data JPA + '],
  ['CLAUDE.md', 'Spring Data JPA + '],
  ['rules/code-style.md', '| 数据库 | '],
];

export const DATABASE_KINDS = [
  { kind: 'postgresql', display: 'PostgreSQL', patterns: [/jdbc:postgresql/i, /org\.postgresql/i, /PostgreSQLDialect/, /<artifactId>postgresql<\/artifactId>/i, /postgres:/i] },
  { kind: 'mysql', display: 'MySQL', patterns: [/jdbc:mysql/i, /com\.mysql/i, /mysql-connector/i, /MySQLDialect/, /mysql:/i] },
  { kind: 'h2', display: 'H2', patterns: [/jdbc:h2/i, /org\.h2/i, /H2Dialect/] },
];
