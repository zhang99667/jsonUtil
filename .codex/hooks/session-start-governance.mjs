import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_INPUT_BYTES = 64 * 1024;
const REQUIRED_ENTRYPOINTS = [
  'AGENTS.md',
  'docs/AI-ENGINEERING-PLAYBOOK.md',
  'docs/AI-EVOLUTION-PLAYBOOK.md',
];
const HEALTHY_CONTEXT = 'JSONUtils governance handoff v1: read AGENTS.md and both AI playbooks before changing rules, skills, MCP, hooks or evals; component checks do not prove behavior outcomes.';
const UNAVAILABLE_CONTEXT = 'JSONUtils governance handoff unavailable: do not change governed AI assets until the project entrypoints and governance checks are reviewed.';
const UNAVAILABLE_MESSAGE = 'JSONUtils governance entrypoints need review.';

const writeContext = ({ additionalContext, systemMessage }) => {
  const output = {
    ...(systemMessage ? { systemMessage } : {}),
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext },
  };
  process.stdout.write(`${JSON.stringify(output)}\n`);
};

const writeUnavailable = () => writeContext({
  additionalContext: UNAVAILABLE_CONTEXT,
  systemMessage: UNAVAILABLE_MESSAGE,
});

const readBoundedInput = () => new Promise((resolve) => {
  const chunks = [];
  let byteCount = 0;
  let oversized = false;
  process.stdin.on('data', (chunk) => {
    byteCount += chunk.length;
    if (byteCount <= MAX_INPUT_BYTES) chunks.push(chunk);
    else oversized = true;
  });
  process.stdin.on('end', () => resolve({ oversized, input: Buffer.concat(chunks).toString('utf8') }));
  process.stdin.on('error', () => resolve({ oversized: true, input: '' }));
});

const hasRequiredEntrypoints = (rootDir) => REQUIRED_ENTRYPOINTS.every((file) => {
  try {
    const metadata = fs.lstatSync(path.join(rootDir, file));
    return metadata.isFile() && !metadata.isSymbolicLink();
  } catch {
    return false;
  }
});

const main = async () => {
  try {
    const { oversized, input } = await readBoundedInput();
    if (oversized) return writeUnavailable();
    const payload = JSON.parse(input);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)
      || payload.hook_event_name !== 'SessionStart'
      || !['startup', 'resume', 'clear', 'compact'].includes(payload.source)) return writeUnavailable();
    const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
    if (!hasRequiredEntrypoints(rootDir)) return writeUnavailable();
    return writeContext({ additionalContext: HEALTHY_CONTEXT });
  } catch {
    return writeUnavailable();
  }
};

await main();
