import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const withJsonutilsGovernanceMcpTempRoot = async (run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-mcp-'));
  try {
    return await run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

export const writeJsonutilsGovernanceMcpFixtureFile = (rootDir, file, content) => {
  const filePath = path.join(rootDir, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};
