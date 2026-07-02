import { expect, type Page } from '@playwright/test';

export const FEATURE_TOUR_IDS = [
  'jsonpath',
  'ai-fix',
  'deep-format',
  'escape',
  'unicode-convert',
  'discovery-jsonpath',
  'discovery-file-ops',
  'discovery-ai-fix',
  'discovery-settings',
];

export interface MainAppReadyOptions {
  waitForSourceEditor?: boolean;
  waitForPreviewEditor?: boolean;
}

const APP_READY_ATTEMPTS = 3;
const APP_SHELL_TIMEOUT_MS = 20_000;
const EDITOR_READY_TIMEOUT_MS = 15_000;

const buildMainAppUrl = (retryTag?: string): string => (
  retryTag ? `/?e2e_retry=${encodeURIComponent(`${retryTag}-${Date.now()}`)}` : '/'
);

export const gotoMainApp = async (page: Page, retryTag?: string) => {
  await page.goto(buildMainAppUrl(retryTag), { waitUntil: 'domcontentloaded' });
};

export const waitForMainAppReady = async (
  page: Page,
  options: MainAppReadyOptions = {}
) => {
  const {
    waitForSourceEditor = true,
    waitForPreviewEditor = true,
  } = options;
  await expect(page.getByText('JSON 工具箱')).toBeVisible({ timeout: APP_SHELL_TIMEOUT_MS });
  if (waitForSourceEditor) {
    await waitForEditorReady(page, '[data-tour="source-editor"]');
  }
  if (waitForPreviewEditor) {
    await waitForEditorReady(page, '[data-tour="preview-editor"]');
  }
};

export const openMainApp = async (
  page: Page,
  options: MainAppReadyOptions = {}
) => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= APP_READY_ATTEMPTS; attempt++) {
    await gotoMainApp(page, attempt === 1 ? undefined : `app-ready-${attempt}`);
    try {
      await waitForMainAppReady(page, options);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

export const waitForEditorReady = async (
  page: Page,
  containerSelector: string
) => {
  const container = page.locator(containerSelector);
  await expect(container).toBeVisible({ timeout: APP_SHELL_TIMEOUT_MS });
  await expect(container.locator('.monaco-editor')).toBeVisible({ timeout: EDITOR_READY_TIMEOUT_MS });
  await expect(container.locator('.view-lines')).toBeVisible({ timeout: EDITOR_READY_TIMEOUT_MS });
};
