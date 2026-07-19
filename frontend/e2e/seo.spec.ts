import { expect, test } from '@playwright/test';

const title = 'JSONUtils - 在线 JSON 格式化、校验与智能修复工具';
const description =
  'JSONUtils 是面向开发者的在线 JSON 工具，支持格式化、语法校验与错误定位、智能修复、JSONPath 查询、差异对比和 TypeScript 类型生成。';

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
      page.getByRole('heading', { name: 'JSONUtils 在线 JSON 工具' })
    ).toBeVisible();
    await expect(page.getByText(description)).toBeVisible();
    await expect(page.locator('main img')).toHaveJSProperty('complete', true);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(viewport.width);

    await context.close();
  });
}

test('robots 与 sitemap 只声明 JSONUtils 域名', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  const sitemap = await request.get('/sitemap.xml');

  await expect(robots).toBeOK();
  await expect(sitemap).toBeOK();
  expect(await robots.text()).toContain(
    'Sitemap: https://jsonutils.markz.fun/sitemap.xml'
  );
  expect(await sitemap.text()).toContain(
    '<loc>https://jsonutils.markz.fun/</loc>'
  );
  expect(await sitemap.text()).not.toContain('https://markz.fun/');
});
