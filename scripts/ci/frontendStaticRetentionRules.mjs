import { composeStaticRetentionSnippets } from './frontendStaticRetentionComposeRules.mjs';
import { deployStaticRetentionSnippets } from './frontendStaticRetentionDeployRules.mjs';
import { dockerStaticRetentionSnippets } from './frontendStaticRetentionDockerRules.mjs';
import { workflowStaticRetentionSnippets } from './frontendStaticRetentionWorkflowRules.mjs';

export const staticRetentionEntrypointFile = 'frontend/docker-entrypoint.d/40-sync-static-assets.sh';

export const requiredStaticRetentionSnippets = [
  ...dockerStaticRetentionSnippets,
  ...composeStaticRetentionSnippets,
  ...deployStaticRetentionSnippets,
  ...workflowStaticRetentionSnippets,
];
