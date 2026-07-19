import fs from 'node:fs';
import path from 'node:path';
import {
  collectSeoPageDrift,
  seoGuideRoutes,
  seoGuides,
} from './generate-seo-pages.mjs';

const label = (file) => `frontend/${file}`;
const exists = (root, file) => fs.existsSync(path.join(root, file));
const read = (root, file) => fs.readFileSync(path.join(root, file), 'utf8');

export function collectSeoDiscoveryFailures(frontendDir, origin, prefix = 'public') {
  const failures = [];
  const robotsFile = `${prefix}/robots.txt`;
  const sitemapFile = `${prefix}/sitemap.xml`;
  for (const file of [robotsFile, sitemapFile]) {
    if (!exists(frontendDir, file)) failures.push(`${label(file)}: 缺少发现文件`);
  }
  if (failures.length > 0) return failures;

  const robots = read(frontendDir, robotsFile);
  const sitemap = read(frontendDir, sitemapFile);
  if (!robots.includes(`Sitemap: ${origin}sitemap.xml`)) {
    failures.push(`${label(robotsFile)}: 必须指向 JSONUtils sitemap`);
  }
  const actualUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const expectedUrls = [
    origin,
    ...seoGuideRoutes.map((route) => `${origin.replace(/\/$/, '')}${route}`),
  ];
  if (
    actualUrls.length !== expectedUrls.length
    || actualUrls.some((url, index) => url !== expectedUrls[index])
  ) {
    failures.push(`${label(sitemapFile)}: 必须精确收录 JSONUtils 首页和独立指南页`);
  }
  if (/https:\/\/(?:www\.)?markz\.fun\//.test(`${robots}\n${sitemap}`)) {
    failures.push(`${label(prefix)}: 发现文件不能声明博客域名`);
  }
  return failures;
}

const collectStructuredDataFailures = (source, fileLabel) => {
  const failures = [];
  const jsonLd = source.match(/<script type="application\/ld\+json">([\s\S]+?)<\/script>/)?.[1];
  try {
    const graph = JSON.parse(jsonLd || '{}')?.['@graph'] || [];
    const types = new Set(graph.map((node) => node?.['@type']));
    if (!types.has('WebPage') || !types.has('BreadcrumbList')) {
      failures.push(`${fileLabel}: 必须声明 WebPage 与 BreadcrumbList`);
    }
    const breadcrumb = graph.find((node) => node?.['@type'] === 'BreadcrumbList');
    if (!Array.isArray(breadcrumb?.itemListElement) || breadcrumb.itemListElement.length < 2) {
      failures.push(`${fileLabel}: 面包屑至少包含产品与当前内容`);
    }
  } catch {
    failures.push(`${fileLabel}: JSON-LD 不是合法 JSON`);
  }
  return failures;
};

export function collectSeoGuideFailures(frontendDir, origin, prefix = 'public') {
  const failures = [...collectSeoPageDrift(frontendDir, prefix)];
  if (!exists(frontendDir, `${prefix}/guides.css`)) {
    failures.push(`${label(`${prefix}/guides.css`)}: 缺少指南样式`);
  }

  const titles = new Set();
  const descriptions = new Set();
  for (const route of seoGuideRoutes) {
    const file = route === '/guides/'
      ? `${prefix}/guides/index.html`
      : `${prefix}${route}index.html`;
    if (!exists(frontendDir, file)) continue;
    const fileLabel = label(file);
    const source = read(frontendDir, file);
    const title = source.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = source.match(/<meta name="description" content="([^"]+)" \/>/)?.[1];
    const canonical = source.match(/<link rel="canonical" href="([^"]+)" \/>/)?.[1];
    if (!title || titles.has(title)) failures.push(`${fileLabel}: title 必须存在且在指南中唯一`);
    else titles.add(title);
    if (!description || description.length < 55 || descriptions.has(description)) {
      failures.push(`${fileLabel}: description 必须具体、完整且在指南中唯一`);
    } else descriptions.add(description);
    if (canonical !== `${origin.replace(/\/$/, '')}${route}`) {
      failures.push(`${fileLabel}: canonical 必须匹配当前指南 URL`);
    }
    if ([...source.matchAll(/<h1(?:\s|>)/g)].length !== 1) {
      failures.push(`${fileLabel}: 必须有且只有一个可见 H1`);
    }
    if (!source.includes('href="/"') || !source.includes('href="/guides/"')) {
      failures.push(`${fileLabel}: 必须提供工具首页与指南中心的可抓取链接`);
    }
    if (route !== '/guides/') {
      if ([...source.matchAll(/<pre><code>/g)].length !== 2) {
        failures.push(`${fileLabel}: 每个任务指南必须提供输入与预期结果代码示例`);
      }
      if ([...source.matchAll(/class="troubleshooting-item"/g)].length !== 3) {
        failures.push(`${fileLabel}: 每个任务指南必须提供 3 条独立故障排查说明`);
      }
      for (const heading of ['输入与预期结果', '常见问题排查']) {
        if (!source.includes(`>${heading}</h2>`)) {
          failures.push(`${fileLabel}: 缺少实用正文模块 ${heading}`);
        }
      }
    }
    if (source.includes('<meta name="keywords"') || /aggregateRating|"review"/.test(source)) {
      failures.push(`${fileLabel}: 不得使用关键词标签或虚构评价结构化数据`);
    }
    failures.push(...collectStructuredDataFailures(source, fileLabel));
  }

  const hubFile = `${prefix}/guides/index.html`;
  if (exists(frontendDir, hubFile)) {
    const hub = read(frontendDir, hubFile);
    for (const guide of seoGuides) {
      if (!hub.includes(`href="/guides/${guide.slug}/"`)) {
        failures.push(`${label(hubFile)}: 缺少 ${guide.shortTitle} 的内部链接`);
      }
    }
  }
  return failures;
}
