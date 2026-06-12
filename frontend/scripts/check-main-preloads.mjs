import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const INITIAL_JS_RAW_BUDGET_BYTES = 560 * 1024;
const INITIAL_JS_GZIP_BUDGET_BYTES = 190 * 1024;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(scriptDir, '..');
const distDir = path.join(frontendDir, 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');

const html = readFileSync(indexHtmlPath, 'utf8');
const linkTags = html.match(/<link\b[^>]*>/g) ?? [];
const scriptTags = html.match(/<script\b[^>]*>/g) ?? [];

const getAttribute = (tag, name) => {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'i'));
  return match ? match[1] : '';
};

const preloadHrefs = linkTags
  .filter((tag) => getAttribute(tag, 'rel').split(/\s+/).includes('modulepreload'))
  .map((tag) => getAttribute(tag, 'href'))
  .filter(Boolean);

const moduleScriptSrcs = scriptTags
  .filter((tag) => getAttribute(tag, 'type') === 'module')
  .map((tag) => getAttribute(tag, 'src'))
  .filter(Boolean);

const forbiddenChunkNames = [
  'vendor-ai',
  'vendor-ant-design-charts',
  'vendor-antd',
  'vendor-antv',
  'vendor-d3',
  'vendor-driver',
  'vendor-graph-utils',
  'vendor-html2canvas',
  'vendor-ml',
];

const forbiddenPreloads = preloadHrefs.filter((href) =>
  forbiddenChunkNames.some((chunkName) => href.includes(chunkName)),
);

if (forbiddenPreloads.length > 0) {
  console.error('主页面首屏预加载包含后台或按需功能重依赖:');
  for (const href of forbiddenPreloads) {
    console.error(`- ${href}`);
  }
  process.exit(1);
}

const formatKiB = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;

const resolveDistAsset = (href) => {
  const relativePath = href.replace(/^\/+/, '');
  return path.join(distDir, relativePath);
};

const initialJsHrefs = [...new Set([...moduleScriptSrcs, ...preloadHrefs])];
const initialJsAssets = initialJsHrefs.map((href) => {
  const content = readFileSync(resolveDistAsset(href));
  return {
    href,
    rawBytes: content.length,
    gzipBytes: gzipSync(content).length,
  };
});

const initialRawBytes = initialJsAssets.reduce((total, asset) => total + asset.rawBytes, 0);
const initialGzipBytes = initialJsAssets.reduce((total, asset) => total + asset.gzipBytes, 0);
const isOverBudget =
  initialRawBytes > INITIAL_JS_RAW_BUDGET_BYTES ||
  initialGzipBytes > INITIAL_JS_GZIP_BUDGET_BYTES;

if (isOverBudget) {
  console.error(
    `主页面首屏 JS 超出预算: raw ${formatKiB(initialRawBytes)} / ${formatKiB(INITIAL_JS_RAW_BUDGET_BYTES)}, gzip ${formatKiB(initialGzipBytes)} / ${formatKiB(INITIAL_JS_GZIP_BUDGET_BYTES)}`,
  );
  for (const asset of initialJsAssets.sort((a, b) => b.gzipBytes - a.gzipBytes)) {
    console.error(`- ${asset.href}: raw ${formatKiB(asset.rawBytes)}, gzip ${formatKiB(asset.gzipBytes)}`);
  }
  process.exit(1);
}

console.log(
  `主页面首屏预加载检查通过，共 ${preloadHrefs.length} 个 modulepreload；初始 JS raw ${formatKiB(initialRawBytes)} / ${formatKiB(INITIAL_JS_RAW_BUDGET_BYTES)}, gzip ${formatKiB(initialGzipBytes)} / ${formatKiB(INITIAL_JS_GZIP_BUDGET_BYTES)}。`,
);
