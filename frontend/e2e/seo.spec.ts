import { expect, test } from '@playwright/test';

const title = 'JSONUtils - 在线 JSON 格式化、校验与智能修复工具';
const description =
  '免费在线 JSON 格式化、校验与修复工具：粘贴或导入数据即可美化、压缩、定位语法错误，并支持 JSONPath、Diff、JSON Schema 和 TypeScript 类型生成。常规处理仅在浏览器本地完成。';

test('页面声明独立且清晰的 JSONUtils 搜索身份', async ({ page }) => {
  await page.route('**/api/visitor/ping', (route) =>
    route.fulfill({ status: 204, body: '' })
  );
  await page.goto('/');

  await expect(page).toHaveTitle(title);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    description
  );
  await expect(page.locator('meta[name="application-name"]')).toHaveAttribute(
    'content',
    'JSONUtils'
  );
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
    'content',
    'JSONUtils'
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://jsonutils.markz.fun/'
  );

  const structuredData = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  const graph = JSON.parse(structuredData || '{}')['@graph'] as Array<
    Record<string, unknown>
  >;
  expect(graph.map((node) => node['@type'])).toEqual(
    expect.arrayContaining(['WebSite', 'WebApplication'])
  );
  expect(
    graph.find((node) => node['@type'] === 'WebApplication')?.featureList
  ).toEqual(
    expect.arrayContaining([
      'JSON 格式化与语法校验',
      '错误定位与智能修复',
      'JSONPath 查询与结构导航',
    ])
  );
  expect(
    graph.find((node) => node['@type'] === 'WebApplication')?.offers
  ).toEqual({
    '@type': 'Offer',
    price: 0,
    priceCurrency: 'CNY',
  });
  await expect(page.locator('body > header')).toHaveCount(0);
  const workbench = page.locator('#root');
  expect(await workbench.evaluate((element) => element.getBoundingClientRect().top)).toBe(0);
  expect(await workbench.evaluate((element) => element.getBoundingClientRect().height))
    .toBe(await page.evaluate(() => window.innerHeight));
  const brandLink = page.getByRole('link', { name: /JSONUtils.*格式化.*校验.*修复/ });
  await expect(page.getByRole('heading', { level: 1, name: /JSONUtils.*格式化.*校验.*修复/ })).toBeVisible();
  await expect(brandLink).toHaveAttribute('href', '/guides/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth));
  const sourcePane = page.locator('[data-tour="source-editor"]');
  await expect(sourcePane.locator('[data-editor-fallback]')).toBeVisible();
  await expect(sourcePane.locator('.monaco-editor')).toHaveCount(0);
  await sourcePane.locator('[data-editor-fallback]').focus();
  await expect(sourcePane.locator('.monaco-editor')).toBeVisible();
  await brandLink.click();
  await expect(page).toHaveURL(/\/guides\/$/);
});

for (const viewport of [
  { name: '320px', width: 320, height: 720 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  test(`禁用脚本时 ${viewport.name} 仍显示可索引的产品说明`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: viewport.width, height: viewport.height },
    });
    const page = await context.newPage();

    await page.goto('/');
    await expect(
      page.getByRole('heading', { level: 1, name: /JSONUtils.*格式化.*校验.*修复/ })
    ).toBeVisible();
    await expect(page.getByText(description)).toBeVisible();
    await expect(page.getByRole('link', { name: 'JSON 格式化', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: '全部使用指南' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '从粘贴数据到定位问题，一页完成' })).toBeVisible();
    await expect(page.locator('.jsonutils-fallback img')).toHaveJSProperty('complete', true);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(viewport.width);

    await context.close();
  });
}

for (const viewport of [
  { name: '320px', width: 320, height: 720 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  test(`${viewport.name} 指南中心与任务页可读且可内部导航`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/guides/');

    await expect(
      page.getByRole('heading', { level: 1, name: '从原始 JSON 到可交付结果' })
    ).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'JSON 格式化', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'JSON 校验', exact: true })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://jsonutils.markz.fun/guides/'
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(viewport.width);

    await page.goto('/guides/json-validator/');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: '在线 JSON 校验工具：定位语法错误与结构问题',
      })
    ).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: '什么时候使用' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '结果检查' })).toBeVisible();
    await expect(page.locator('.cta-panel .button')).toHaveAttribute('href', '/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(viewport.width);
  });
}

test('robots 与 sitemap 只声明 JSONUtils 域名', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  const sitemap = await request.get('/sitemap.xml');
  const admin = await request.get('/admin.html');

  await expect(robots).toBeOK();
  await expect(sitemap).toBeOK();
  expect(await robots.text()).toContain(
    'Sitemap: https://jsonutils.markz.fun/sitemap.xml'
  );
  expect(await sitemap.text()).toContain(
    '<loc>https://jsonutils.markz.fun/</loc>'
  );
  expect(await sitemap.text()).toContain(
    '<loc>https://jsonutils.markz.fun/guides/json-formatter/</loc>'
  );
  expect((await sitemap.text()).match(/<loc>/g)).toHaveLength(9);
  expect(await sitemap.text()).not.toContain('https://markz.fun/');
  expect(await admin.text()).toContain(
    '<meta name="robots" content="noindex, nofollow" />'
  );
});
