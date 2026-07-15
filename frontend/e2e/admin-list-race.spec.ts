import { expect, test, type Route } from '@playwright/test';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

const createDeferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

const fulfillResult = async (route: Route, data: unknown) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ code: 200, message: 'success', data }),
  });
};

const fulfillDashboard = async (route: Route) => {
  await fulfillResult(route, {
    totalUsers: 2,
    activeSubscriptions: 1,
    totalRevenue: 0,
    todayPv: 0,
    todayUv: 0,
  });
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'mock-admin-token');
  });
});

test('用户启停完成后按最新搜索条件刷新列表', async ({ page }) => {
  const mutationGate = createDeferred<void>();
  let mutationReleased = false;
  let mutationRequestCount = 0;

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === '/api/stats') {
      await fulfillDashboard(route);
      return;
    }

    if (
      ['/api/admin/users/1', '/api/admin/users/1/toggle-enabled'].includes(url.pathname) &&
      request.method() === 'PUT'
    ) {
      mutationRequestCount += 1;
      await mutationGate.promise;
      await fulfillResult(route, null);
      return;
    }

    if (url.pathname === '/api/admin/users' && request.method() === 'GET') {
      const keyword = url.searchParams.get('keyword');
      const isLatestQuery = keyword === 'beta';
      const isPostMutationRefresh = mutationReleased && isLatestQuery;
      await fulfillResult(route, {
        content: [{
          id: isLatestQuery ? 2 : 1,
          username: isPostMutationRefresh
            ? '查询乙用户已刷新'
            : isLatestQuery ? '查询乙用户' : '查询甲用户',
          email: null,
          role: 'USER',
          enabled: true,
          createdAt: '2026-07-14T10:00:00',
        }],
        totalElements: 1,
        totalPages: 1,
        number: Number(url.searchParams.get('page') ?? 0),
        size: Number(url.searchParams.get('size') ?? 10),
      });
      return;
    }

    await route.fulfill({ status: 404, body: '' });
  });

  try {
    await page.goto('/admin.html');
    await page.getByRole('menuitem', { name: '用户管理' }).click();

    const searchInput = page.getByPlaceholder('搜索用户名');
    await searchInput.fill('alpha');
    await searchInput.press('Enter');
    const firstUserRow = page.getByRole('row').filter({ hasText: '查询甲用户' });
    await expect(firstUserRow).toBeVisible();

    const mutationRequestPromise = page.waitForRequest(request => (
      new URL(request.url()).pathname.startsWith('/api/admin/users/1') &&
      request.method() === 'PUT'
    ));
    await firstUserRow.getByRole('switch').evaluate((element) => {
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const mutationRequest = await mutationRequestPromise;
    await page.waitForTimeout(100);

    expect(mutationRequestCount).toBe(1);
    expect(new URL(mutationRequest.url()).pathname).toBe('/api/admin/users/1');
    expect(mutationRequest.postDataJSON()).toEqual({ enabled: false });

    await searchInput.fill('beta');
    await searchInput.press('Enter');
    await expect(page.getByRole('row').filter({ hasText: '查询乙用户' })).toBeVisible();

    mutationReleased = true;
    const refreshRequest = page.waitForRequest(request => (
      new URL(request.url()).pathname === '/api/admin/users' && request.method() === 'GET'
    ));
    const refreshResponse = page.waitForResponse(response => (
      new URL(response.url()).pathname === '/api/admin/users' && response.request().method() === 'GET'
    ));
    mutationGate.resolve(undefined);
    const [request] = await Promise.all([refreshRequest, refreshResponse]);

    expect(new URL(request.url()).searchParams.get('keyword')).toBe('beta');
    await expect(page.getByRole('row').filter({ hasText: '查询乙用户已刷新' })).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: '查询甲用户' })).toHaveCount(0);
  } finally {
    mutationGate.resolve(undefined);
  }
});

test('文件删除完成后按最新搜索条件刷新列表', async ({ page }) => {
  const mutationGate = createDeferred<void>();
  let mutationReleased = false;

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === '/api/stats') {
      await fulfillDashboard(route);
      return;
    }

    if (url.pathname === '/api/admin/files/11' && request.method() === 'DELETE') {
      await mutationGate.promise;
      await fulfillResult(route, null);
      return;
    }

    if (url.pathname === '/api/admin/files' && request.method() === 'GET') {
      const keyword = url.searchParams.get('keyword');
      const isLatestQuery = keyword === 'beta';
      const isPostMutationRefresh = mutationReleased && isLatestQuery;
      await fulfillResult(route, {
        list: [{
          id: isLatestQuery ? 12 : 11,
          fileName: isPostMutationRefresh
            ? '查询乙-已刷新.json'
            : isLatestQuery ? '查询乙.json' : '查询甲.json',
          fileSize: 128,
          fileType: 'application/json',
          uploadTime: '2026-07-14 10:00:00',
          uploader: 'admin',
        }],
        total: 1,
      });
      return;
    }

    await route.fulfill({ status: 404, body: '' });
  });

  try {
    await page.goto('/admin.html');
    await page.getByRole('menuitem', { name: '文件管理' }).click();

    const searchInput = page.getByPlaceholder('搜索文件名...');
    await searchInput.fill('alpha');
    await searchInput.press('Enter');
    const firstFileRow = page.getByRole('row').filter({ hasText: '查询甲.json' });
    await expect(firstFileRow).toBeVisible();

    const mutationRequest = page.waitForRequest(request => (
      new URL(request.url()).pathname === '/api/admin/files/11' && request.method() === 'DELETE'
    ));
    await firstFileRow.getByRole('button', { name: '删除' }).click();
    await page.getByRole('tooltip').getByRole('button', { name: /确\s*认/ }).click();
    await mutationRequest;

    await searchInput.fill('beta');
    await searchInput.press('Enter');
    await expect(page.getByRole('row').filter({ hasText: '查询乙.json' })).toBeVisible();

    mutationReleased = true;
    const refreshRequest = page.waitForRequest(request => (
      new URL(request.url()).pathname === '/api/admin/files' && request.method() === 'GET'
    ));
    const refreshResponse = page.waitForResponse(response => (
      new URL(response.url()).pathname === '/api/admin/files' && response.request().method() === 'GET'
    ));
    mutationGate.resolve(undefined);
    const [request] = await Promise.all([refreshRequest, refreshResponse]);

    expect(new URL(request.url()).searchParams.get('keyword')).toBe('beta');
    await expect(page.getByRole('row').filter({ hasText: '查询乙-已刷新.json' })).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: '查询甲.json' })).toHaveCount(0);
  } finally {
    mutationGate.resolve(undefined);
  }
});
