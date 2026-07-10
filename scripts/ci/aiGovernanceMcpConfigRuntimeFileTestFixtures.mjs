import { writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

export const writeMcpRuntimeConfigFixture = (rootDir, file, config) => {
  writeFixtureFile(rootDir, file, JSON.stringify(config));
};

export const writeLocalMcpScriptFixture = (rootDir, file = 'scripts/mcp/local.js') => {
  writeFixtureFile(rootDir, file, 'console.log("ok");');
};
