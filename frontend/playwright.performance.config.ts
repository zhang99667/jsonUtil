import { defineConfig } from '@playwright/test';

const previewPort = 4174;
const usePrebuiltDist = process.env.PLAYWRIGHT_PREBUILT === '1';
const browserChannel = process.env.PLAYWRIGHT_CHANNEL || (process.env.CI ? undefined : 'chrome');

export default defineConfig({
  testDir: './e2e-performance',
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  outputDir: 'test-results/e2e-performance',
  use: {
    baseURL: `http://127.0.0.1:${previewPort}`,
    browserName: 'chromium',
    channel: browserChannel,
    headless: true,
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `${usePrebuiltDist ? '' : 'npm run build && '}npm run preview -- --host 127.0.0.1 --port ${previewPort}`,
    url: `http://127.0.0.1:${previewPort}`,
    reuseExistingServer: !process.env.CI,
    timeout: 90_000,
  },
});
