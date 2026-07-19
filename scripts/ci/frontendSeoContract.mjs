import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  collectFrontendSeoFailures as collectFrontendAssetSeoFailures,
} from '../../frontend/scripts/frontend-seo-contract.mjs';
import { collectNginxPublicRoutingFailures } from './frontendNginxPublicRouting.mjs';

export { jsonutilsSeo } from '../../frontend/scripts/frontend-seo-contract.mjs';

export function collectFrontendSeoFailures(rootDir) {
  return [
    ...collectFrontendAssetSeoFailures(path.join(rootDir, 'frontend')),
    ...collectNginxPublicRoutingFailures(rootDir),
  ];
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const failures = collectFrontendSeoFailures(rootDir);
  if (failures.length > 0) {
    failures.forEach(failure => console.error(`- ${failure}`));
    process.exitCode = 1;
  } else {
    console.log('JSONUtils SEO 资产与 Nginx 公开路由契约检查通过。');
  }
}
