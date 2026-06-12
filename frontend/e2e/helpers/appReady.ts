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
  waitForPreviewEditor?: boolean;
}

export const waitForMainAppReady = async (
  page: Page,
  options: MainAppReadyOptions = {}
) => {
  const { waitForPreviewEditor = true } = options;
  await expect(page.getByText('JSON 工具箱')).toBeVisible({ timeout: 20_000 });
  await waitForEditorReady(page, '[data-tour="source-editor"]');
  if (waitForPreviewEditor) {
    await waitForEditorReady(page, '[data-tour="preview-editor"]');
  }
};

export const openMainApp = async (
  page: Page,
  options: MainAppReadyOptions = {}
) => {
  const maxAttempts = 2;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    try {
      await waitForMainAppReady(page, options);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await page.reload({ waitUntil: 'domcontentloaded' });
      }
    }
  }

  throw lastError;
};

export const waitForEditorReady = async (
  page: Page,
  containerSelector: string
) => {
  const container = page.locator(containerSelector);
  await expect(container).toBeVisible({ timeout: 20_000 });
  await expect(container.locator('.monaco-editor')).toBeVisible({ timeout: 45_000 });
  await expect(container.locator('.view-lines')).toBeVisible({ timeout: 45_000 });
};
