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

export const SUBAGENT_DELEGATION_REFERENCES = ['子 Agent 委派', '主线程负责', '拆分边界'];

export const CHUNK_LOAD_RECOVERY_CATCH_REFERENCES = [
  'node scripts/ci/check-chunk-load-recovery-catches.mjs',
  'dispatchChunkLoadRecoveryEvent',
  '手动懒加载',
];

export const AI_SAFETY_BOUNDARY_REFERENCES = [
  '本地规则优先',
  '用户手动触发',
  '敏感内容不外泄',
  '可验证闭环',
];

export const AI_EVOLUTION_LOOP_REFERENCES = ['复盘沉淀', '规则/skill 回写', '治理校验'];

export const VERSION_CHANGELOG_REFERENCES = [
  'node scripts/ci/check-version-consistency.mjs',
  'frontend/package.json',
  'frontend/package-lock.json',
  'CHANGELOG.md',
];
