import { readStableUtf8File } from './aiGovernanceStableUtf8File.mjs';

export const AI_GOVERNANCE_CI_ENTRY_MAX_BYTES = 1024 * 1024;

export const readAiGovernanceCiEntrySource = (rootDir, file) => {
  const source = readStableUtf8File(rootDir, file, AI_GOVERNANCE_CI_ENTRY_MAX_BYTES);
  if (source.status === 'ok') return { content: source.content, failures: [] };
  const reason = source.status === 'missing'
    ? '缺少 AI 治理自动化入口'
    : source.status === 'too-large'
      ? `AI 治理自动化入口不能超过 ${AI_GOVERNANCE_CI_ENTRY_MAX_BYTES} bytes`
      : source.status === 'invalid-utf8'
        ? 'AI 治理自动化入口必须是严格 UTF-8'
        : 'AI 治理自动化入口必须是稳定可读的非 symlink 单链接普通文件';
  return { content: null, failures: [`${file}: ${reason}`] };
};
