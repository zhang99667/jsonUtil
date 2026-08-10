import {
  CODE_STYLE_GOVERNANCE_REFERENCES,
  CORE_ENTRY_REFERENCES,
  ENTRY_GOVERNANCE_REFERENCES,
} from './aiGovernanceEntryCoreReferenceGroups.mjs';
import { CLAUDE_README_REFERENCE_RULE } from './aiGovernanceClaudeReadmeReferenceRule.mjs';

const buildAgentEntryRule = file => ({
  file,
  contains: [
    ...CORE_ENTRY_REFERENCES,
    ...ENTRY_GOVERNANCE_REFERENCES,
  ],
});

export const AI_GOVERNANCE_PROJECT_ENTRY_REFERENCE_RULES = [
  { file: 'README.md', contains: ['docs/AI-TOOLS-SETUP.md',
    'node scripts/ci/check-ai-asset-distribution.mjs --workspace', 'node scripts/ci/manage-project-plugins.mjs --check',
    'AVAILABLE', '.codex/config.toml', 'trusted project', '新建任务', '插件目录发现', '不会因 clone 或打开项目自动安装'] },
  { file: 'CONTRIBUTING.md', contains: ['docs/AI-ENGINEERING-PLAYBOOK.md',
    'node scripts/ci/check-ai-asset-distribution.mjs --index', '使用 `--head`', 'node scripts/ci/manage-project-plugins.mjs --check',
    'AVAILABLE', '插件目录发现', '新建任务'] },
  buildAgentEntryRule('AGENTS.md'),
  buildAgentEntryRule('CLAUDE.md'),
  { file: 'rules/code-style.md', contains: CODE_STYLE_GOVERNANCE_REFERENCES },
  CLAUDE_README_REFERENCE_RULE,
];
