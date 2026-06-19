import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const MAIN_INITIAL_JS_RAW_BUDGET_BYTES = 560 * 1024;
const MAIN_INITIAL_JS_GZIP_BUDGET_BYTES = 190 * 1024;
const ADMIN_INITIAL_JS_RAW_BUDGET_BYTES = 1_500 * 1024;
const ADMIN_INITIAL_JS_GZIP_BUDGET_BYTES = 520 * 1024;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(scriptDir, '..');
const distDir = path.join(frontendDir, 'dist');

const getAttribute = (tag, name) => {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'i'));
  return match ? match[1] : '';
};

const mainForbiddenChunkNames = [
  'vendor-ai',
  'vendor-ant-design-charts',
  'vendor-antd',
  'vendor-antv',
  'vendor-d3',
  'vendor-driver',
  'vendor-graph-utils',
  'vendor-html2canvas',
  'vendor-ml',
  'vendor-qrcode',
];

const adminForbiddenChunkNames = [
  'vendor-ant-design-charts',
  'vendor-antv',
  'vendor-d3',
  'vendor-graph-utils',
  'vendor-html2canvas',
  'vendor-ml',
];

const forbiddenInitialAssetPatterns = [
  {
    label: 'qrcode.react 二维码实现',
    pattern: /@license qrcode\.react|QRCodeCanvas|QRCodeSVG/,
  },
];

const formatKiB = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;

const resolveDistAsset = (href) => {
  const relativePath = href.replace(/^\/+/, '');
  return path.join(distDir, relativePath);
};

const readEntryAssets = (htmlFileName) => {
  const html = readFileSync(path.join(distDir, htmlFileName), 'utf8');
  const linkTags = html.match(/<link\b[^>]*>/g) ?? [];
  const scriptTags = html.match(/<script\b[^>]*>/g) ?? [];
  const preloadHrefs = linkTags
    .filter((tag) => getAttribute(tag, 'rel').split(/\s+/).includes('modulepreload'))
    .map((tag) => getAttribute(tag, 'href'))
    .filter(Boolean);
  const moduleScriptSrcs = scriptTags
    .filter((tag) => getAttribute(tag, 'type') === 'module')
    .map((tag) => getAttribute(tag, 'src'))
    .filter(Boolean);
  const initialJsHrefs = [...new Set([...moduleScriptSrcs, ...preloadHrefs])];
  const initialJsAssets = initialJsHrefs.map((href) => {
    const content = readFileSync(resolveDistAsset(href));
    return {
      href,
      rawBytes: content.length,
      gzipBytes: gzipSync(content).length,
      source: content.toString('utf8'),
    };
  });

  return {
    preloadHrefs,
    initialJsAssets,
  };
};

const checkEntryPreloads = ({
  htmlFileName,
  label,
  forbiddenChunkNames,
  forbiddenAssetPatterns = [],
  rawBudgetBytes,
  gzipBudgetBytes,
}) => {
  const { preloadHrefs, initialJsAssets } = readEntryAssets(htmlFileName);
  const forbiddenPreloads = preloadHrefs.filter((href) =>
    forbiddenChunkNames.some((chunkName) => href.includes(chunkName)),
  );

  if (forbiddenPreloads.length > 0) {
    console.error(`${label}首屏预加载包含应按需加载的重依赖:`);
    for (const href of forbiddenPreloads) {
      console.error(`- ${href}`);
    }
    process.exit(1);
  }

  const forbiddenInitialAssetMatches = initialJsAssets.flatMap((asset) =>
    forbiddenAssetPatterns
      .filter(({ pattern }) => pattern.test(asset.source))
      .map(({ label: patternLabel }) => ({ href: asset.href, label: patternLabel })),
  );

  if (forbiddenInitialAssetMatches.length > 0) {
    console.error(`${label}首屏 JS 包含应按需加载的实现:`);
    for (const match of forbiddenInitialAssetMatches) {
      console.error(`- ${match.href}: ${match.label}`);
    }
    process.exit(1);
  }

  const initialRawBytes = initialJsAssets.reduce((total, asset) => total + asset.rawBytes, 0);
  const initialGzipBytes = initialJsAssets.reduce((total, asset) => total + asset.gzipBytes, 0);
  const isOverBudget =
    initialRawBytes > rawBudgetBytes ||
    initialGzipBytes > gzipBudgetBytes;

  if (isOverBudget) {
    console.error(
      `${label}首屏 JS 超出预算: raw ${formatKiB(initialRawBytes)} / ${formatKiB(rawBudgetBytes)}, gzip ${formatKiB(initialGzipBytes)} / ${formatKiB(gzipBudgetBytes)}`,
    );
    for (const asset of initialJsAssets.sort((a, b) => b.gzipBytes - a.gzipBytes)) {
      console.error(`- ${asset.href}: raw ${formatKiB(asset.rawBytes)}, gzip ${formatKiB(asset.gzipBytes)}`);
    }
    process.exit(1);
  }

  console.log(
    `${label}首屏预加载检查通过，共 ${preloadHrefs.length} 个 modulepreload；初始 JS raw ${formatKiB(initialRawBytes)} / ${formatKiB(rawBudgetBytes)}, gzip ${formatKiB(initialGzipBytes)} / ${formatKiB(gzipBudgetBytes)}。`,
  );
};

checkEntryPreloads({
  htmlFileName: 'index.html',
  label: '主页面',
  forbiddenChunkNames: mainForbiddenChunkNames,
  forbiddenAssetPatterns: forbiddenInitialAssetPatterns,
  rawBudgetBytes: MAIN_INITIAL_JS_RAW_BUDGET_BYTES,
  gzipBudgetBytes: MAIN_INITIAL_JS_GZIP_BUDGET_BYTES,
});

checkEntryPreloads({
  htmlFileName: 'admin.html',
  label: '后台页面',
  forbiddenChunkNames: adminForbiddenChunkNames,
  rawBudgetBytes: ADMIN_INITIAL_JS_RAW_BUDGET_BYTES,
  gzipBudgetBytes: ADMIN_INITIAL_JS_GZIP_BUDGET_BYTES,
});
