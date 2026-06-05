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

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('JSON 工具箱')).toBeVisible();
  await expect(page.locator('[data-tour="source-editor"] .monaco-editor')).toBeVisible({ timeout: 30_000 });
});

test('未保存草稿会阻止页面卸载', async ({ page }) => {
  await expect(isBeforeUnloadPrevented(page)).resolves.toBe(false);

  await fillSourceEditor(page, '{"draft":true}');
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"draft":true');

  await expect.poll(() => isBeforeUnloadPrevented(page)).toBe(true);
});

test('无文件草稿另存后不再阻止页面卸载', async ({ page }) => {
  await installSavePickerMock(page);
  await fillSourceEditor(page, '{"draft":false}');
  await expect.poll(() => isBeforeUnloadPrevented(page)).toBe(true);

  await page.locator('[data-tour="save-file-button"]').click();

  await expect(page.getByText('draft.json').first()).toBeVisible();
  await expect.poll(async () => page.evaluate(() => {
    const writes = (window as unknown as { __jsonHelperSavedWrites: string[] }).__jsonHelperSavedWrites;
    return writes.at(-1) ?? null;
  })).toBe('{"draft":false}');
  await expect.poll(() => isBeforeUnloadPrevented(page)).toBe(false);
});

test('无文件草稿新建标签时保留原草稿', async ({ page }) => {
  await fillSourceEditor(page, '{"draft":"keep"}');
  await expect.poll(() => isBeforeUnloadPrevented(page)).toBe(true);

  await page.getByTitle('新建标签 (Cmd+N)').click();

  const editorTabs = page.locator('[data-tour="editor-tabs"]');
  await expect(editorTabs.getByText('Untitled-1')).toBeVisible();
  await expect(editorTabs.getByText('Untitled-2')).toBeVisible();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).not.toContainText('"draft":"keep"');

  await editorTabs.getByText('Untitled-1').click();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"draft":"keep"');
  await expect(page.locator('[data-tour="editor-tabs"] button[title="未保存"]')).toHaveCount(1);
  await expect.poll(() => isBeforeUnloadPrevented(page)).toBe(true);
});

test('无文件草稿打开文件时保留原草稿', async ({ page }) => {
  await installOpenPickerMock(page, 'opened.json', '{"opened":1}');
  await fillSourceEditor(page, '{"draft":"open"}');
  await expect.poll(() => isBeforeUnloadPrevented(page)).toBe(true);

  await page.locator('[data-tour="open-file-button"]').click();

  const editorTabs = page.locator('[data-tour="editor-tabs"]');
  await expect(editorTabs.getByText('Untitled-1')).toBeVisible();
  await expect(editorTabs.getByText('opened.json')).toBeVisible();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"opened":1');

  await editorTabs.getByText('Untitled-1').click();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"draft":"open"');
  await expect(page.locator('[data-tour="editor-tabs"] button[title="未保存"]')).toHaveCount(1);
  await expect.poll(() => isBeforeUnloadPrevented(page)).toBe(true);
});

test('无文件草稿拖入文件时保留原草稿', async ({ page }) => {
  await fillSourceEditor(page, '{"draft":"drop"}');
  await expect.poll(() => isBeforeUnloadPrevented(page)).toBe(true);

  await dropFile(page, 'dropped.json', '{"dropped":1}');

  const editorTabs = page.locator('[data-tour="editor-tabs"]');
  await expect(editorTabs.getByText('Untitled-1')).toBeVisible();
  await expect(editorTabs.getByText('dropped.json')).toBeVisible();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"dropped":1');

  await editorTabs.getByText('Untitled-1').click();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"draft":"drop"');
  await expect(page.locator('[data-tour="editor-tabs"] button[title="未保存"]')).toHaveCount(1);
  await expect.poll(() => isBeforeUnloadPrevented(page)).toBe(true);
});

const isBeforeUnloadPrevented = async (page: Page) => page.evaluate(() => {
  const event = new Event('beforeunload', { cancelable: true });
  return !window.dispatchEvent(event);
});

const installOpenPickerMock = async (page: Page, name: string, content: string) => {
  await page.evaluate(({ name, content }) => {
    Object.defineProperty(window, 'showOpenFilePicker', {
      configurable: true,
      value: async () => [
        {
          name,
          getFile: async () => new File([content], name, { type: 'application/json' }),
        },
      ],
    });
  }, { name, content });
};

const installSavePickerMock = async (page: Page) => {
  await page.evaluate(() => {
    const savedWrites: string[] = [];
    Object.defineProperty(window, '__jsonHelperSavedWrites', {
      value: savedWrites,
      configurable: true,
    });

    Object.defineProperty(window, 'showSaveFilePicker', {
      configurable: true,
      value: async () => ({
        name: 'draft.json',
        createWritable: async () => ({
          write: async (content: string) => {
            savedWrites.push(String(content));
          },
          close: async () => undefined,
        }),
      }),
    });
  });
};

const dropFile = async (page: Page, name: string, content: string) => {
  await page.locator('[data-tour="source-editor"]').evaluate((target, { name, content }) => {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File([content], name, { type: 'application/json' }));
    target.dispatchEvent(new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer,
    }));
  }, { name, content });
};

const fillSourceEditor = async (page: Page, value: string) => {
  const sourceEditor = page.locator('[data-tour="source-editor"] .monaco-editor').first();
  const selectAllShortcut = `${process.platform === 'darwin' ? 'Meta' : 'Control'}+A`;
  await sourceEditor.click();
  await page.keyboard.press(selectAllShortcut);
  await page.keyboard.press(selectAllShortcut);
  await page.keyboard.press('Backspace');
  await page.keyboard.insertText(value);
};
