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

    const savedWrites: string[] = [];
    Object.defineProperty(window, '__jsonHelperSavedWrites', {
      value: savedWrites,
      configurable: true,
    });

    Object.defineProperty(window, 'showOpenFilePicker', {
      configurable: true,
      value: async () => [
        {
          name: 'autosave.json',
          getFile: async () => new File(['{"saved":1}'], 'autosave.json', { type: 'application/json' }),
          createWritable: async () => ({
            write: async (content: string) => {
              savedWrites.push(String(content));
            },
            close: async () => undefined,
          }),
        },
      ],
    });
  }, FEATURE_TOUR_IDS);

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('JSON 工具箱')).toBeVisible();
  await expect(page.locator('[data-tour="source-editor"] .monaco-editor')).toBeVisible({ timeout: 30_000 });
});

test('自动保存成功后清除标签未保存状态', async ({ page }) => {
  await page.locator('[data-tour="open-file-button"]').click();
  await expect(page.getByText('autosave.json').first()).toBeVisible();

  await page.locator('[data-tour="auto-save"]').click();
  await fillSourceEditor(page, '{"saved":2}');

  await expect(page.locator('[data-tour="editor-tabs"] button[title="未保存"]')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => {
    const writes = (window as unknown as { __jsonHelperSavedWrites: string[] }).__jsonHelperSavedWrites;
    return writes.at(-1) ?? null;
  })).toBe('{"saved":2}');

  await expect(page.locator('[data-tour="editor-tabs"] button[title="未保存"]')).toHaveCount(0);
  await expect(page.locator('[data-tour="editor-tabs"] button[title="关闭"]')).toHaveCount(1);
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
