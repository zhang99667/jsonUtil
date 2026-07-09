import fs from 'node:fs';
import path from 'node:path';
import { collectNginxPublicRoutingFailures } from './frontendNginxPublicRouting.mjs';
import {
  requiredStaticRetentionSnippets,
  staticRetentionEntrypointFile,
} from './frontendStaticRetentionRules.mjs';

export { staticRetentionEntrypointFile };

export const collectStaticRetentionConfigFailures = (
  rootDir,
  rules = requiredStaticRetentionSnippets,
  options = { includeNginxRouting: rules === requiredStaticRetentionSnippets }
) => {
  const failures = [];
  for (const rule of rules) {
    const filePath = path.join(rootDir, rule.file);
    if (!fs.existsSync(filePath)) {
      failures.push(`${rule.file}: 缺少配置文件`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    rule.snippets.forEach((snippet) => {
      if (!content.includes(snippet)) {
        failures.push(`${rule.file}: 缺少 "${snippet}"`);
      }
    });
  }
  if (options.includeNginxRouting) failures.push(...collectNginxPublicRoutingFailures(rootDir));
  return failures;
};
