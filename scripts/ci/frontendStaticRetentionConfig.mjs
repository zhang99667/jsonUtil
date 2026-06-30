import fs from 'node:fs';
import path from 'node:path';
import {
  requiredStaticRetentionSnippets,
  staticRetentionEntrypointFile,
} from './frontendStaticRetentionRules.mjs';

export { staticRetentionEntrypointFile };

export const collectStaticRetentionConfigFailures = (rootDir, rules = requiredStaticRetentionSnippets) => {
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
  return failures;
};
