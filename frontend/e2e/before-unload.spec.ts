import { expect, test, type Page } from '@playwright/test';

const FEATURE_TOUR_IDS = [
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

test.beforeEach(async ({ page }) => {
  await page.route('**/api/visitor/ping', async route => {
    await route.fulfill({ status: 204, body: '' });
  });

  await page.addInitScript((featureTourIds: string[]) => {
    window.localStorage.setItem('json-helper-onboarding-completed', 'true');
    featureTourIds.forEach(featureId => {
      window.localStorage.setItem(`json-helper-feature-tour-${featureId}`, 'completed');
    });
  }, FEATURE_TOUR_IDS);

  await page.goto('/');
  await expect(page.getByText('JSON 工具箱')).toBeVisible();
  await expect(page.locator('[data-tour="source-editor"] .monaco-editor')).toBeVisible();
});

test('未保存草稿会阻止页面卸载', async ({ page }) => {
  await expect(isBeforeUnloadPrevented(page)).resolves.toBe(false);

  await fillSourceEditor(page, '{"draft":true}');
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"draft":true');

  await expect.poll(() => isBeforeUnloadPrevented(page)).toBe(true);
});

const isBeforeUnloadPrevented = async (page: Page) => page.evaluate(() => {
  const event = new Event('beforeunload', { cancelable: true });
  return !window.dispatchEvent(event);
});

const fillSourceEditor = async (page: Page, value: string) => {
  const sourceEditor = page.locator('[data-tour="source-editor"] .monaco-editor').first();
  const selectAllShortcut = `${process.platform === 'darwin' ? 'Meta' : 'Control'}+A`;
  await sourceEditor.click();
  await page.keyboard.press(selectAllShortcut);
  await page.keyboard.press(selectAllShortcut);
  await page.keyboard.press('Backspace');
  await page.keyboard.insertText(value);
};
