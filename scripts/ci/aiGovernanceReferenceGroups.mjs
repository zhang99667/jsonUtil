export const PUBLIC_FRONTEND_ASSET_AUDIT_REFERENCES = [
  'node scripts/ci/check-production-frontend-assets.mjs',
  'Content-Type',
  'fallback 成 HTML',
  'CSS `url(...)`',
  'CSS `@import`',
  '--extra-asset',
];

export const DEPLOY_SHELL_SYNTAX_REFERENCES = [
  'node scripts/ci/check-deploy-shell-syntax.mjs',
  'REMOTE_SCRIPT heredoc',
  'workflow run',
];

export const SUBAGENT_DELEGATION_REFERENCES = [
  '子 Agent 委派',
  '主线程负责',
  '拆分边界',
];

export const CHUNK_LOAD_RECOVERY_CATCH_REFERENCES = [
  'node scripts/ci/check-chunk-load-recovery-catches.mjs',
  'dispatchChunkLoadRecoveryEvent',
  '手动懒加载',
];
