const PUBLIC_FRONTEND_ASSET_AUDIT_REFERENCES = [
  'node scripts/ci/check-production-frontend-assets.mjs',
  'Content-Type',
  'fallback 成 HTML',
  'CSS `url(...)`',
  'CSS `@import`',
  '--extra-asset',
];

const DEPLOY_SHELL_SYNTAX_REFERENCES = [
  'node scripts/ci/check-deploy-shell-syntax.mjs',
  'REMOTE_SCRIPT heredoc',
  'workflow run',
];

export const buildAiGovernanceRequiredFiles = (codexSkillFiles) => [
  'AGENTS.md',
  'CLAUDE.md',
  'rules/code-style.md',
  'docs/AI-ENGINEERING-PLAYBOOK.md',
  '.claude/ai-tools-guide.md',
  '.codex/README.md',
  ...codexSkillFiles,
  'scripts/ci/check-deploy-shell-syntax.mjs',
  'scripts/ci/check-frontend-static-retention.mjs',
  'scripts/ci/check-production-frontend-assets.mjs',
  'scripts/ci/check-maintainability-budgets.mjs',
];

export const buildAiGovernanceReferenceRules = (codexSkillFiles) => [
  { file: 'AGENTS.md', contains: ['rules/code-style.md', 'docs/AI-ENGINEERING-PLAYBOOK.md'] },
  { file: 'CLAUDE.md', contains: ['rules/code-style.md', 'docs/AI-ENGINEERING-PLAYBOOK.md'] },
  {
    file: '.claude/ai-tools-guide.md',
    contains: [
      'AGENTS.md',
      ...codexSkillFiles,
      'docs/AI-ENGINEERING-PLAYBOOK.md',
      ...DEPLOY_SHELL_SYNTAX_REFERENCES,
      'node scripts/ci/check-frontend-static-retention.mjs',
      ...PUBLIC_FRONTEND_ASSET_AUDIT_REFERENCES,
    ],
  },
  {
    file: '.codex/README.md',
    contains: [
      'AGENTS.md',
      'rules/code-style.md',
      'docs/AI-ENGINEERING-PLAYBOOK.md',
      ...DEPLOY_SHELL_SYNTAX_REFERENCES,
      'node scripts/ci/check-frontend-static-retention.mjs',
      ...PUBLIC_FRONTEND_ASSET_AUDIT_REFERENCES,
      ...codexSkillFiles.map(file => file.replace('.codex/', '')),
    ],
  },
  ...codexSkillFiles.map(file => ({
    file,
    contains: [
      'AGENTS.md',
      'rules/code-style.md',
      'docs/AI-ENGINEERING-PLAYBOOK.md',
      'npm run lint',
      'npm run typecheck',
      'npm run build',
      'npm run check:preloads',
      ...DEPLOY_SHELL_SYNTAX_REFERENCES,
      'node scripts/ci/check-frontend-static-retention.mjs',
      'node scripts/ci/check-maintainability-budgets.mjs',
      ...PUBLIC_FRONTEND_ASSET_AUDIT_REFERENCES,
    ],
  })),
  {
    file: 'docs/AI-ENGINEERING-PLAYBOOK.md',
    contains: [
      'AGENTS.md',
      'CLAUDE.md',
      ...codexSkillFiles,
      'npm run lint',
      'npm run check:preloads',
      ...DEPLOY_SHELL_SYNTAX_REFERENCES,
      'node scripts/ci/check-frontend-static-retention.mjs',
      'git diff --check',
      'node scripts/ci/check-maintainability-budgets.mjs',
      ...PUBLIC_FRONTEND_ASSET_AUDIT_REFERENCES,
    ],
  },
];
