import { CORE_ENTRY_REFERENCES } from './aiGovernanceRuntimeReferenceGroups.mjs';

export const CLAUDE_README_REFERENCE_RULE = {
  file: '.claude/README.md',
  contains: [
    'AGENTS.md',
    'CLAUDE.md',
    ...CORE_ENTRY_REFERENCES,
    '.claude/ai-tools-guide.md',
    '.codex/config.toml',
    '.claude/settings.local.json',
    '本机私有配置',
    '显式豁免',
  ],
};
