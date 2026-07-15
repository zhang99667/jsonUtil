import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const CONFIG_FILE = '.codex/hooks.json';
const RUNTIME_FILE = '.codex/hooks/session-start-governance.mjs';
const MAX_CONFIG_BYTES = 8 * 1024;
const MAX_RUNTIME_BYTES = 8 * 1024;
const EXPECTED_RUNTIME_SHA256 = '5a7de41ece43d7067b2c5e5efd09b86d8c461299f76a7bd1c94282164ccb4c50';
const REQUIRED_RUNTIME_SNIPPETS = [
  'MAX_INPUT_BYTES = 64 * 1024',
  "payload.hook_event_name !== 'SessionStart'",
  "!['startup', 'resume', 'clear', 'compact'].includes(payload.source)",
  "path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')",
  'metadata.isFile() && !metadata.isSymbolicLink()',
  'hookSpecificOutput',
  "hookEventName: 'SessionStart'",
  'component checks do not prove behavior outcomes',
];
const FORBIDDEN_RUNTIME_PATTERNS = [
  [/process\.env/, '环境变量读取'],
  [/node:(?:child_process|http|https|net|tls|dgram|worker_threads)/, '子进程或网络模块'],
  [/\bfetch\s*\(/, '网络请求'],
  [/fs\.(?:write|append|unlink|rm|rename|mkdir|chmod|chown|truncate|copyFile)/, '文件写入 API'],
  [/(?:outcomes|trial-receipts|feedback-inbox)\.jsonl/, '治理账本访问'],
  [/(?:transcript_path|prompt|tool_input|tool_response)/, '敏感 lifecycle 正文读取'],
];

export const CODEX_SESSION_START_HOOK_CONTRACT = Object.freeze({
  caseId: 'codex-project-session-start-hook-boundary',
  behaviorCaseId: 'codex-project-session-start-hook-observed',
  version: '1.1.0',
});

export const CODEX_SESSION_START_HOOK_FILES = Object.freeze([CONFIG_FILE, RUNTIME_FILE]);

export const AI_GOVERNANCE_CODEX_HOOK_REQUIRED_FILES = Object.freeze([
  ...CODEX_SESSION_START_HOOK_FILES,
  'scripts/ci/aiGovernanceCodexHooks.mjs',
  'scripts/ci/aiGovernanceCodexHookCaseDescriptors.mjs',
  'scripts/ci/aiGovernanceCodexHooks.test.mjs',
  'scripts/ci/aiGovernanceEvolutionCorpusSize.test.mjs',
  'scripts/ci/maintainability-budget-governance-ai-hook-contract-rules.mjs',
]);

export const CANONICAL_CODEX_HOOK_CONFIG = `${JSON.stringify({
  hooks: {
    SessionStart: [{
      matcher: 'startup|resume|clear|compact',
      hooks: [{
        type: 'command',
        command: 'node "$(git rev-parse --show-toplevel)/.codex/hooks/session-start-governance.mjs"',
        commandWindows: 'powershell.exe -NoLogo -NoProfile -NonInteractive -Command "$root = (& git rev-parse --show-toplevel); if ($LASTEXITCODE -ne 0) { exit 0 }; & node (Join-Path $root \'.codex/hooks/session-start-governance.mjs\'); exit $LASTEXITCODE"',
        timeout: 10,
        statusMessage: 'Checking repository AI governance entrypoints',
      }],
    }],
  },
}, null, 2)}\n`;

const readRegularFile = (rootDir, file, maxBytes) => {
  const absolute = path.join(rootDir, file);
  try {
    const metadata = fs.lstatSync(absolute);
    if (!metadata.isFile() || metadata.isSymbolicLink()) return { failure: `${file}: 必须是普通文件且不能是 symlink` };
    if (metadata.size > maxBytes) return { failure: `${file}: 不能超过 ${maxBytes} bytes` };
    return { text: fs.readFileSync(absolute, 'utf8') };
  } catch (error) {
    return { failure: `${file}: 无法读取（${error.code ?? 'unknown'}）` };
  }
};

export const collectCodexHookFailures = (rootDir) => {
  const failures = [];
  const config = readRegularFile(rootDir, CONFIG_FILE, MAX_CONFIG_BYTES);
  if (config.failure) failures.push(config.failure);
  else if (config.text !== CANONICAL_CODEX_HOOK_CONFIG) failures.push(`${CONFIG_FILE}: 必须是单一 SessionStart advisory 的 canonical 闭字段配置`);
  const runtime = readRegularFile(rootDir, RUNTIME_FILE, MAX_RUNTIME_BYTES);
  if (runtime.failure) failures.push(runtime.failure);
  else {
    const digest = crypto.createHash('sha256').update(runtime.text).digest('hex');
    if (digest !== EXPECTED_RUNTIME_SHA256) failures.push(`${RUNTIME_FILE}: 内容摘要与已审计 runtime 不一致`);
    REQUIRED_RUNTIME_SNIPPETS.filter(snippet => !runtime.text.includes(snippet))
      .forEach(snippet => failures.push(`${RUNTIME_FILE}: 缺少固定边界 ${snippet}`));
    FORBIDDEN_RUNTIME_PATTERNS.filter(([pattern]) => pattern.test(runtime.text))
      .forEach(([, label]) => failures.push(`${RUNTIME_FILE}: 禁止${label}`));
  }
  return failures;
};
