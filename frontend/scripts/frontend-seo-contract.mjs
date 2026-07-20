import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  collectSeoDiscoveryFailures,
  collectSeoGuideFailures,
} from './frontend-seo-guide-contract.mjs';

export const jsonutilsSeo = {
  origin: 'https://jsonutils.markz.fun/',
  title: 'JSONUtils - 在线 JSON 格式化、校验与智能修复工具',
  description: '免费在线 JSON 格式化、校验与修复工具：粘贴或导入数据即可美化、压缩、定位语法错误，并支持 JSONPath、Diff、JSON Schema 和 TypeScript 类型生成。常规处理仅在浏览器本地完成。',
};

const frontendLabel = file => `frontend/${file}`;
const read = (frontendDir, file) => fs.readFileSync(path.join(frontendDir, file), 'utf8');
const exists = (frontendDir, file) => fs.existsSync(path.join(frontendDir, file));
const adminNoindex = '<meta name="robots" content="noindex, nofollow" />';
const collectAdminFailures = (file, source) => source.includes(adminNoindex)
  ? [] : [`${file}: 后台必须声明 noindex, nofollow`];

const indexRequirements = () => [
  `<title>${jsonutilsSeo.title}</title>`,
  '<meta name="application-name" content="JSONUtils" />',
  `<meta name="description" content="${jsonutilsSeo.description}" />`,
  `<link rel="canonical" href="${jsonutilsSeo.origin}" />`,
  '<meta property="og:site_name" content="JSONUtils" />',
  `<meta property="og:url" content="${jsonutilsSeo.origin}" />`,
  '<body class="bg-editor-bg text-editor-fg h-screen overflow-hidden">',
  '<div id="root" class="jsonutils-workbench">',
  '<h1 id="jsonutils-fallback-title">JSONUtils 在线 JSON 格式化、校验与修复工具</h1>',
  '<nav class="mt-8" aria-label="JSONUtils 使用指南">',
];

function collectIndexFailures(file, source) {
  const failures = indexRequirements()
    .filter(snippet => !source.includes(snippet))
    .map(snippet => `${file}: 缺少 SEO 契约 ${snippet}`);
  if (/https:\/\/(?:www\.)?markz\.fun\//.test(source)) {
    failures.push(`${file}: 不能声明博客域名`);
  }
  if (source.includes('jsonutils-app-bar')) failures.push(`${file}: 工具首页不能保留全局顶部栏`);
  if (!/\.jsonutils-workbench\s*\{[^}]*height:\s*100vh;/.test(source)) failures.push(`${file}: 工具工作区必须从页面顶部占满视口`);
  if ([...source.matchAll(/<h1(?:\s|>)/g)].length !== 1) {
    failures.push(`${file}: 工具首页必须有且只有一个稳定可见 H1`);
  }
  if (source.includes('jsonutils-learn') || source.includes('jsonutils-app-bar')) {
    failures.push(`${file}: 工具首页必须保持单屏工作台，不能在工作区外追加落地页内容或产品栏`);
  }
  const rootSection = source.match(/<div id="root"[\s\S]*?<\/div>/)?.[0] || '';
  const guideLinks = [...rootSection.matchAll(/href="\/guides\//g)];
  if (guideLinks.length < 5) {
    failures.push(`${file}: 无脚本产品说明必须保留至少 5 个任务指南链接`);
  }
  if (!rootSection.includes(jsonutilsSeo.description)) {
    failures.push(`${file}: 无脚本产品说明必须保留清晰的工具摘要`);
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
    if (application?.offers?.price !== 0 || application?.offers?.priceCurrency !== 'CNY') {
      failures.push(`${file}: 免费 WebApplication 必须声明真实的零价格`);
    }
    if (graph.some(node => node?.aggregateRating || node?.review)) {
      failures.push(`${file}: 没有真实评价时不能声明评分或评论`);
    }
  } catch {
    failures.push(`${file}: JSON-LD 不是合法 JSON`);
  }
  return failures;
}

export function collectFrontendSeoFailures(frontendDir) {
  const failures = [];
  const sourceIndex = 'index.html';
  const sourceLabel = frontendLabel(sourceIndex);
  if (!exists(frontendDir, sourceIndex)) failures.push(`${sourceLabel}: 缺少入口文件`);
  else failures.push(...collectIndexFailures(sourceLabel, read(frontendDir, sourceIndex)));
  if (!exists(frontendDir, 'admin.html')) failures.push('frontend/admin.html: 缺少后台入口文件');
  else failures.push(...collectAdminFailures('frontend/admin.html', read(frontendDir, 'admin.html')));

  failures.push(...collectSeoDiscoveryFailures(frontendDir, jsonutilsSeo.origin));
  failures.push(...collectSeoGuideFailures(frontendDir, jsonutilsSeo.origin));

  const metadata = JSON.parse(read(frontendDir, 'metadata.json'));
  if (metadata.name !== 'JSONUtils' || metadata.description !== jsonutilsSeo.description) {
    failures.push('frontend/metadata.json: 产品名与摘要必须和站点 SEO 身份一致');
  }

  const distIndex = 'dist/index.html';
  if (exists(frontendDir, distIndex)) {
    failures.push(...collectIndexFailures(frontendLabel(distIndex), read(frontendDir, distIndex)));
    failures.push(...collectSeoDiscoveryFailures(frontendDir, jsonutilsSeo.origin, 'dist'));
    failures.push(...collectSeoGuideFailures(frontendDir, jsonutilsSeo.origin, 'dist'));
    failures.push(...collectAdminFailures('frontend/dist/admin.html', read(frontendDir, 'dist/admin.html')));
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
