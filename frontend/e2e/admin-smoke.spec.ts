import { expect, test, type Page, type Route } from '@playwright/test';

const fulfillResult = async (route: Route, data: unknown) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ code: 200, message: 'success', data }),
  });
};

const setupAdminApiMocks = async (page: Page) => {
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path === '/api/stats') {
      await fulfillResult(route, {
        totalUsers: 12,
        activeSubscriptions: 3,
        totalRevenue: 128.5,
        todayPv: 42,
        todayUv: 18,
      });
      return;
    }

    if (path === '/api/admin/traffic/overview') {
      await fulfillResult(route, {
        totalPv: 120,
        totalUv: 48,
        todayPv: 42,
        todayUv: 18,
        avgDailyPv: 60,
        avgDailyUv: 24,
        days: 1,
      });
      return;
    }

    if (path === '/api/admin/traffic/trend') {
      await fulfillResult(route, [
        { date: '2026-06-19', pv: 78, uv: 30 },
        { date: '2026-06-20', pv: 42, uv: 18 },
      ]);
      return;
    }

    if (path === '/api/admin/traffic/top-ips') {
      await fulfillResult(route, [{ ip: '127.0.0.1', count: 12, region: '本地' }]);
      return;
    }

    if (path === '/api/admin/traffic/top-paths') {
      await fulfillResult(route, [{ path: '/', count: 20 }]);
      return;
    }

    if (path === '/api/admin/traffic/hourly') {
      await fulfillResult(route, Array.from({ length: 24 }, (_, hour) => ({ hour, count: hour === 9 ? 12 : 1 })));
      return;
    }

    if (path === '/api/admin/traffic/geo-distribution') {
      await fulfillResult(route, [{ region: '北京', count: 18, percentage: 100 }]);
      return;
    }

    if (path === '/api/admin/traffic/device-distribution') {
      await fulfillResult(route, [{ device: 'Desktop', browser: null, count: 18, percentage: 100 }]);
      return;
    }

    if (path === '/api/admin/traffic/browser-distribution') {
      await fulfillResult(route, [{ device: null, browser: 'Chrome', count: 18, percentage: 100 }]);
      return;
    }

    if (path === '/api/admin/traffic/referer-distribution') {
      await fulfillResult(route, [{ source: 'direct', domain: null, count: 18, percentage: 100 }]);
      return;
    }

    if (path === '/api/admin/traffic/session-duration') {
      await fulfillResult(route, [{ durationRange: '0-10s', count: 8, percentage: 44.4 }]);
      return;
    }

    if (path === '/api/admin/traffic/tool-events') {
      await fulfillResult(route, {
        totalEvents: 20,
        successEvents: 18,
        failedEvents: 2,
        failureRate: 10,
        topEvents: [{ label: 'SOURCE_PASTE', count: 5, percentage: 25 }],
        statusDistribution: [{ label: 'success', count: 18, percentage: 90 }],
        inputSizeDistribution: [{ label: 'lt_10kb', count: 20, percentage: 100 }],
        durationDistribution: [{ label: 'lt_100ms', count: 20, percentage: 100 }],
      });
      return;
    }

    await route.fulfill({ status: 404, body: '' });
  });
};

const getLoadedScriptNames = async (page: Page) => (
  page.evaluate(() => performance.getEntriesByType('resource')
    .map(entry => entry.name)
    .filter(name => name.includes('/assets/')))
);

test.beforeEach(async ({ page }) => {
  await setupAdminApiMocks(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'mock-admin-token');
  });
});

test('后台图表依赖只在流量统计页按需加载', async ({ page }) => {
  await page.goto('/admin.html');

  await expect(page.getByText('系统概览')).toBeVisible();
  await expect(page.getByText('总用户数')).toBeVisible();

  const dashboardAssets = await getLoadedScriptNames(page);
  expect(dashboardAssets.filter(name => (
    name.includes('vendor-antv') ||
    name.includes('vendor-d3') ||
    name.includes('vendor-html2canvas') ||
    name.includes('vendor-ant-design-charts')
  ))).toEqual([]);

  await page.getByRole('menuitem', { name: '流量统计' }).click();

  await expect(page.getByText('工具使用洞察')).toBeVisible();
  await expect(page.getByText('24小时访问分布')).toBeVisible();
  await expect.poll(async () => {
    const assets = await getLoadedScriptNames(page);
    return assets.some(name => name.includes('vendor-ant-design-charts')) &&
      assets.some(name => name.includes('vendor-antv-g2'));
  }).toBe(true);
});

test('流量接口局部失败时保留其他统计结果', async ({ page }) => {
  await page.route('**/api/admin/traffic/geo-distribution*', async route => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ code: 500, message: '地区统计暂不可用', data: null }),
    });
  });

  await page.goto('/admin.html');
  await page.getByRole('menuitem', { name: '流量统计' }).click();

  await expect(page.getByText('部分数据不可用')).toBeVisible();
  await expect(page.getByText('工具使用洞察')).toBeVisible();
  await expect(page.getByText('Desktop')).toBeVisible();
  await expect(page.getByText('Chrome')).toBeVisible();
});
