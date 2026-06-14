import { expect, test, type Page } from '@playwright/test';
import { FEATURE_TOUR_IDS, openMainApp, waitForMainAppReady } from './helpers/appReady';

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

  await openMainApp(page, { waitForPreviewEditor: false });
});

test('未保存草稿会阻止页面卸载', async ({ page }) => {
  await expect(isBeforeUnloadPrevented(page)).resolves.toBe(false);

  await fillSourceEditor(page, '{"draft":true}');
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"draft":true');

  await expect.poll(() => isBeforeUnloadPrevented(page)).toBe(true);
});

test('无文件草稿刷新后自动恢复', async ({ page }) => {
  await fillSourceEditor(page, '{"draft":"recover-after-reload"}');
  await expect.poll(async () => page.evaluate(() => (
    window.localStorage.getItem('json-helper-workspace-draft')
  ))).not.toBeNull();

  page.once('dialog', dialog => dialog.accept());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForMainAppReady(page, { waitForPreviewEditor: false });

  await expect(page.getByText('已恢复上次未保存草稿')).toBeVisible();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"recover-after-reload"');
  await expect.poll(() => isBeforeUnloadPrevented(page)).toBe(true);
});

test('未保存标签刷新后自动恢复', async ({ page }) => {
  await fillSourceEditor(page, '{"draft":"tab-recover-after-reload"}');
  await page.getByTitle('新建标签 (Cmd+N)').click();

  const editorTabs = page.locator('[data-tour="editor-tabs"]');
  await expect(editorTabs.getByText('Untitled-1')).toBeVisible();
  await expect(editorTabs.getByText('Untitled-2')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => (
    window.localStorage.getItem('json-helper-workspace-draft')
  ))).toContain('tab-recover-after-reload');

  page.once('dialog', dialog => dialog.accept());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForMainAppReady(page, { waitForPreviewEditor: false });

  await expect(page.getByText('已恢复上次未保存标签')).toBeVisible();
  await expect(page.locator('[data-tour="editor-tabs"]').getByText('Untitled-1')).toBeVisible();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"tab-recover-after-reload"');
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

test('关闭未保存标签使用应用内确认', async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(window, '__nativeConfirmCalls', {
      value: 0,
      writable: true,
      configurable: true,
    });
    window.confirm = () => {
      (window as unknown as { __nativeConfirmCalls: number }).__nativeConfirmCalls += 1;
      return false;
    };
  });

  await fillSourceEditor(page, '{"draft":"close-confirm"}');
  await page.getByTitle('新建标签 (Cmd+N)').click();

  const editorTabs = page.locator('[data-tour="editor-tabs"]');
  await expect(editorTabs.getByText('Untitled-1')).toBeVisible();
  await editorTabs.locator('button[title="未保存"]').click();

  const confirmDialog = page.locator('[data-tour="confirm-dialog"]');
  await expect(confirmDialog).toBeVisible();
  await expect(confirmDialog).toContainText('关闭未保存标签');
  await expect(confirmDialog).toContainText('Untitled-1');
  await expect(page.getByRole('button', { name: '继续编辑' })).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: '关闭并丢弃' })).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '继续编辑' })).toBeFocused();

  await page.getByRole('button', { name: '继续编辑' }).click();
  await expect(confirmDialog).toBeHidden();
  await expect(editorTabs.getByText('Untitled-1')).toBeVisible();
  await expect(editorTabs.locator('button[title="未保存"]')).toBeFocused();

  await editorTabs.locator('button[title="未保存"]').click();
  await page.getByRole('button', { name: '关闭并丢弃' }).click();

  await expect(confirmDialog).toBeHidden();
  await expect(editorTabs.getByText('Untitled-1')).toBeHidden();
  await expect.poll(() => isBeforeUnloadPrevented(page)).toBe(false);
  await expect.poll(async () => page.evaluate(() => (
    (window as unknown as { __nativeConfirmCalls: number }).__nativeConfirmCalls
  ))).toBe(0);
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

test('无文件草稿批量打开文件时保留原草稿', async ({ page }) => {
  await installOpenPickerMockForFiles(page, [
    { name: 'first-open.json', content: '{"firstOpen":1}' },
    { name: 'second-open.json', content: '{"secondOpen":2}' },
  ]);
  await fillSourceEditor(page, '{"draft":"multi-open"}');
  await expect.poll(() => isBeforeUnloadPrevented(page)).toBe(true);

  await page.locator('[data-tour="open-file-button"]').click();

  const editorTabs = page.locator('[data-tour="editor-tabs"]');
  await expect(editorTabs.getByText('Untitled-1')).toBeVisible();
  await expect(editorTabs.getByText('first-open.json')).toBeVisible();
  await expect(editorTabs.getByText('second-open.json')).toBeVisible();
  await expect(page.getByText('已打开 2 个文件')).toBeVisible();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"secondOpen":2');

  await editorTabs.getByText('first-open.json').click();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"firstOpen":1');

  await editorTabs.getByText('Untitled-1').click();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"draft":"multi-open"');
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

test('拖入多个文件时批量打开并保留原草稿', async ({ page }) => {
  await fillSourceEditor(page, '{"draft":"multi-drop"}');
  await expect.poll(() => isBeforeUnloadPrevented(page)).toBe(true);

  await dropFiles(page, [
    { name: 'first.json', content: '{"first":1}' },
    { name: 'second.json', content: '{"second":2}' },
  ]);

  const editorTabs = page.locator('[data-tour="editor-tabs"]');
  await expect(editorTabs.getByText('Untitled-1')).toBeVisible();
  await expect(editorTabs.getByText('first.json')).toBeVisible();
  await expect(editorTabs.getByText('second.json')).toBeVisible();
  await expect(page.getByText('已打开 2 个文件')).toBeVisible();
  await editorTabs.getByText('second.json').click();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"second":2');

  await editorTabs.getByText('first.json').click();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"first":1');

  await editorTabs.getByText('Untitled-1').click();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"draft":"multi-drop"');
  await expect(page.locator('[data-tour="editor-tabs"] button[title="未保存"]')).toHaveCount(1);
  await expect.poll(() => isBeforeUnloadPrevented(page)).toBe(true);
});

const isBeforeUnloadPrevented = async (page: Page) => page.evaluate(() => {
  const event = new Event('beforeunload', { cancelable: true });
  return !window.dispatchEvent(event);
});

const installOpenPickerMock = async (page: Page, name: string, content: string) => {
  await installOpenPickerMockForFiles(page, [{ name, content }]);
};

const installOpenPickerMockForFiles = async (page: Page, files: Array<{ name: string; content: string }>) => {
  await page.evaluate((mockFiles) => {
    Object.defineProperty(window, 'showOpenFilePicker', {
      configurable: true,
      value: async () => mockFiles.map(file => ({
        name: file.name,
        getFile: async () => new File([file.content], file.name, { type: 'application/json' }),
      })),
    });
  }, files);
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
  await dropFiles(page, [{ name, content }]);
};

const dropFiles = async (page: Page, files: Array<{ name: string; content: string }>) => {
  await page.locator('[data-tour="source-editor"]').evaluate((target, filesToDrop) => {
    const dataTransfer = new DataTransfer();
    filesToDrop.forEach(file => {
      dataTransfer.items.add(new File([file.content], file.name, { type: 'application/json' }));
    });
    target.dispatchEvent(new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer,
    }));
  }, files);
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
