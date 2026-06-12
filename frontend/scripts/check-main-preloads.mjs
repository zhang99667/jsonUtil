import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(scriptDir, '..');
const indexHtmlPath = path.join(frontendDir, 'dist', 'index.html');

const html = readFileSync(indexHtmlPath, 'utf8');
const linkTags = html.match(/<link\b[^>]*>/g) ?? [];

const getAttribute = (tag, name) => {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'i'));
  return match ? match[1] : '';
};

const preloadHrefs = linkTags
  .filter((tag) => getAttribute(tag, 'rel').split(/\s+/).includes('modulepreload'))
  .map((tag) => getAttribute(tag, 'href'))
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

console.log(`主页面首屏预加载检查通过，共 ${preloadHrefs.length} 个 modulepreload。`);
