import { expect, test, type Route } from '@playwright/test';

const fulfillResult = async (route: Route, data: unknown) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ code: 200, message: 'success', data }),
  });
};

const fulfillLoginFailure = async (route: Route) => {
  await route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ code: 401, message: '用户名或密码错误', data: null }),
  });
};

test('登录请求在途时去重，迟到失败不撤销新会话且允许重试', async ({ page }) => {
  let loginRequestCount = 0;
  let firstAttemptPending = true;
  let releaseFirstAttempt = () => {};
  const firstAttemptGate = new Promise<void>((resolve) => {
    releaseFirstAttempt = resolve;
  });

  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path === '/api/auth/login') {
      loginRequestCount += 1;
      if (firstAttemptPending) {
        await firstAttemptGate;
        await fulfillLoginFailure(route);
        return;
      }

      await fulfillResult(route, { token: 'new-admin-token' });
      return;
    }

    if (path === '/api/stats') {
      await fulfillResult(route, {
        totalUsers: 1,
        activeSubscriptions: 1,
        totalRevenue: 0,
        todayPv: 1,
        todayUv: 1,
      });
      return;
    }

    await route.fulfill({ status: 404, body: '' });
  });

  await page.goto('/admin.html');
  await page.getByPlaceholder('用户名').fill('admin');
  await page.getByPlaceholder('密码').fill('错误密码');

  const loginButton = page.getByRole('button', { name: /登\s*录/ });
  await loginButton.click();
  await expect.poll(() => loginRequestCount).toBe(1);
  const wasDisabledWhilePending = await loginButton.isDisabled();
  await loginButton.evaluate((button: HTMLButtonElement) => button.click());
  await page.waitForTimeout(100);
  const requestsWhilePending = loginRequestCount;
  await page.evaluate(() => window.localStorage.setItem('token', 'newer-admin-token'));
  firstAttemptPending = false;
  releaseFirstAttempt();

  expect(requestsWhilePending).toBe(1);
  expect(wasDisabledWhilePending).toBe(true);
  await expect(loginButton).toBeEnabled();
  await expect(page.getByText('用户名或密码错误')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('token')))
    .toBe('newer-admin-token');

  await page.evaluate(() => window.localStorage.removeItem('token'));
  await page.getByPlaceholder('密码').fill('正确密码');
  await loginButton.click();

  await expect(page.getByText('系统概览')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('token')))
    .toBe('new-admin-token');
  expect(loginRequestCount).toBe(2);
});

test('登录响应只有空白令牌时保持在登录页', async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path === '/api/auth/login') {
      await fulfillResult(route, { token: '   \t\n' });
      return;
    }

    await route.fulfill({ status: 404, body: '' });
  });

  await page.goto('/admin.html');
  await page.getByPlaceholder('用户名').fill('admin');
  await page.getByPlaceholder('密码').fill('正确密码');
  await page.getByRole('button', { name: /登\s*录/ }).click();

  await expect(page.getByText('登录响应缺少认证令牌，请重试')).toBeVisible();
  await expect(page.getByRole('button', { name: /登\s*录/ })).toBeVisible();
  await expect(page.getByText('登录成功')).not.toBeVisible();
  await expect(page.getByText('系统概览')).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('token')))
    .toBeNull();
});

test('登录令牌无法写入本地存储时保持在登录页', async ({ page }) => {
  await page.addInitScript(() => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (this === window.localStorage && key === 'token') {
        throw new DOMException('本地存储不可用', 'QuotaExceededError');
      }
      return originalSetItem.call(this, key, value);
    };
  });

  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path === '/api/auth/login') {
      await fulfillResult(route, { token: 'new-admin-token' });
      return;
    }

    await route.fulfill({ status: 404, body: '' });
  });

  await page.goto('/admin.html');
  await page.getByPlaceholder('用户名').fill('admin');
  await page.getByPlaceholder('密码').fill('正确密码');
  await page.getByRole('button', { name: /登\s*录/ }).click();

  await expect(page.getByText('无法保存登录状态，请检查浏览器存储权限后重试')).toBeVisible();
  await expect(page.getByRole('button', { name: /登\s*录/ })).toBeVisible();
  await expect(page.getByText('登录成功')).not.toBeVisible();
  await expect(page.getByText('系统概览')).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('token')))
    .toBeNull();
});
