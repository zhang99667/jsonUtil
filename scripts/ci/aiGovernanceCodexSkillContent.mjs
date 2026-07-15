import { readStableUtf8File } from './aiGovernanceStableUtf8File.mjs';

export const CODEX_SKILL_SOURCE_MAX_BYTES = 64 * 1024;

export const readExistingCodexSkillContent = (rootDir, file) => {
  const result = readStableUtf8File(rootDir, file, CODEX_SKILL_SOURCE_MAX_BYTES);
  if (result.status === 'missing') return { content: null, failures: [] };
  if (result.status === 'ok') return { content: result.content, failures: [] };
  const reason = result.status === 'too-large'
    ? `skill source 不能超过 ${CODEX_SKILL_SOURCE_MAX_BYTES} bytes`
    : result.status === 'invalid-utf8'
      ? 'skill source 必须是严格 UTF-8'
      : 'skill source 必须是稳定可读的非 symlink 普通文件';
  return { content: null, failures: [`${file}: ${reason}`] };
};
