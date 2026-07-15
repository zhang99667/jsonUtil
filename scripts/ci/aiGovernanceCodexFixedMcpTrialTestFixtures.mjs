import { createHash } from 'node:crypto';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export const ROOT_DIR = path.resolve(import.meta.dirname, '../..');
export const REVISION = `worktree-${'a'.repeat(64)}`;
export const hashFile = async filePath => createHash('sha256').update(await readFile(filePath)).digest('hex');

export const createFixedMcpShim = async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'jsonutils-fixed-mcp-shim-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const binaryPath = path.join(directory, 'codex-shim.mjs');
  const source = `#!${process.execPath}
if (process.argv.length !== 3 || process.argv[2] !== '--version') process.exit(91);
if (process.env.CODEX_API_KEY || process.env.OPENAI_API_KEY) process.exit(90);
if (!process.env.HOME || !process.env.CODEX_HOME || !process.env.TMPDIR) process.exit(92);
process.stdout.write('codex-cli 0.144.0-alpha.4\\n');
`;
  await writeFile(binaryPath, source, 'utf8');
  await chmod(binaryPath, 0o755);
  return binaryPath;
};

export const runFixedMcpCases = ({ commandEnv } = {}) => {
  if (!commandEnv || Object.keys(commandEnv).some(key => /(?:KEY|TOKEN|SECRET|PASSWORD|AUTH)/i.test(key))) {
    throw new Error('固定 validation 环境携带凭据');
  }
  return {
    ok: true,
    results: [{
      caseId: 'mcp-fixed-tool-selection',
      validations: [{ command: 'node --test fixed-mcp-component.test.mjs', status: 'passed' }],
    }],
  };
};
