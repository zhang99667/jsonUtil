import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const jsonutilsSeo = {
  origin: 'https://jsonutils.markz.fun/',
  title: 'JSONUtils - 在线 JSON 格式化、校验与智能修复工具',
  description: 'JSONUtils 是面向开发者的在线 JSON 工具，支持格式化、语法校验与错误定位、智能修复、JSONPath 查询、差异对比和 TypeScript 类型生成。',
};

const frontendLabel = file => `frontend/${file}`;
const read = (frontendDir, file) => fs.readFileSync(path.join(frontendDir, file), 'utf8');
const exists = (frontendDir, file) => fs.existsSync(path.join(frontendDir, file));

const indexRequirements = () => [
  `<title>${jsonutilsSeo.title}</title>`,
  '<meta name="application-name" content="JSONUtils" />',
  `<meta name="description" content="${jsonutilsSeo.description}" />`,
  `<link rel="canonical" href="${jsonutilsSeo.origin}" />`,
  '<meta property="og:site_name" content="JSONUtils" />',
  `<meta property="og:url" content="${jsonutilsSeo.origin}" />`,
  '<h1 id="jsonutils-title" class="mb-4 text-3xl font-semibold">JSONUtils 在线 JSON 工具</h1>',
];

function collectIndexFailures(file, source) {
  const failures = indexRequirements()
    .filter(snippet => !source.includes(snippet))
    .map(snippet => `${file}: 缺少 SEO 契约 ${snippet}`);
  if (/https:\/\/(?:www\.)?markz\.fun\//.test(source)) {
    failures.push(`${file}: 不能声明博客域名`);
  }

  const jsonLdBlocks = [...source.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (jsonLdBlocks.length !== 1) return [...failures, `${file}: 必须声明一份 JSON-LD`];
  try {
    const payload = JSON.parse(jsonLdBlocks[0][1]);
    const graph = Array.isArray(payload?.['@graph']) ? payload['@graph'] : [];
    const types = new Set(graph.map(node => node?.['@type']));
    if (!types.has('WebSite')) failures.push(`${file}: 缺少 WebSite 结构化数据`);
    if (!types.has('WebApplication')) failures.push(`${file}: 缺少 WebApplication 结构化数据`);
    const application = graph.find(node => node?.['@type'] === 'WebApplication');
    if (!Array.isArray(application?.featureList) || application.featureList.length < 5) {
      failures.push(`${file}: WebApplication 必须声明清晰的能力列表`);
    }
  } catch {
    failures.push(`${file}: JSON-LD 不是合法 JSON`);
  }
  return failures;
}

function collectDiscoveryFailures(frontendDir, prefix = 'public') {
  const failures = [];
  const robotsFile = `${prefix}/robots.txt`;
  const sitemapFile = `${prefix}/sitemap.xml`;
  const robotsLabel = frontendLabel(robotsFile);
  const sitemapLabel = frontendLabel(sitemapFile);
  for (const [file, label] of [[robotsFile, robotsLabel], [sitemapFile, sitemapLabel]]) {
    if (!exists(frontendDir, file)) failures.push(`${label}: 缺少发现文件`);
  }
  if (failures.length > 0) return failures;

  const robots = read(frontendDir, robotsFile);
  const sitemap = read(frontendDir, sitemapFile);
  if (!robots.includes(`Sitemap: ${jsonutilsSeo.origin}sitemap.xml`)) {
    failures.push(`${robotsLabel}: 必须指向 JSONUtils sitemap`);
  }
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  if (locations.length !== 1 || locations[0] !== jsonutilsSeo.origin) {
    failures.push(`${sitemapLabel}: 只能收录 JSONUtils 根页面`);
  }
  if (/https:\/\/(?:www\.)?markz\.fun\//.test(`${robots}\n${sitemap}`)) {
    failures.push(`${frontendLabel(prefix)}: 发现文件不能声明博客域名`);
  }
  return failures;
}

export function collectFrontendSeoFailures(frontendDir) {
  const failures = [];
  const sourceIndex = 'index.html';
  const sourceLabel = frontendLabel(sourceIndex);
  if (!exists(frontendDir, sourceIndex)) failures.push(`${sourceLabel}: 缺少入口文件`);
  else failures.push(...collectIndexFailures(sourceLabel, read(frontendDir, sourceIndex)));

  failures.push(...collectDiscoveryFailures(frontendDir));

  const metadata = JSON.parse(read(frontendDir, 'metadata.json'));
  if (metadata.name !== 'JSONUtils' || metadata.description !== jsonutilsSeo.description) {
    failures.push('frontend/metadata.json: 产品名与摘要必须和站点 SEO 身份一致');
  }

  const distIndex = 'dist/index.html';
  if (exists(frontendDir, distIndex)) {
    failures.push(...collectIndexFailures(frontendLabel(distIndex), read(frontendDir, distIndex)));
    failures.push(...collectDiscoveryFailures(frontendDir, 'dist'));
  }
  return failures;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const failures = collectFrontendSeoFailures(frontendDir);
  if (failures.length > 0) {
    failures.forEach(failure => console.error(`- ${failure}`));
    process.exitCode = 1;
  } else {
    console.log('JSONUtils SEO 身份、元数据、发现文件与构建产物检查通过。');
  }
}
