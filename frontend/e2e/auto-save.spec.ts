import { expect, test, type Page } from '@playwright/test';
import { FEATURE_TOUR_IDS, openMainApp } from './helpers/appReady';

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

  await openMainApp(page, { waitForPreviewEditor: false });
});

test('自动保存成功后清除标签未保存状态', async ({ page }) => {
  await page.locator('[data-tour="open-file-button"]').click();
  await expect(page.getByText('autosave.json').first()).toBeVisible();
  await expect(page.locator('[data-tour="save-status"]')).toHaveText('已保存');

  await page.locator('[data-tour="auto-save"]').click();
  await expect(page.getByText('自动保存已开启')).toBeVisible();
  await expect(page.locator('[data-tour="save-status"]')).toHaveText('自动保存已同步');
  await fillSourceEditor(page, '{"saved":2}');

  const dirtyCloseButton = page.getByRole('button', { name: '关闭未保存标签 autosave.json' });
  await expect(dirtyCloseButton).toBeVisible();
  await expect(dirtyCloseButton).toHaveAttribute('title', '关闭未保存标签 autosave.json');
  await expect(page.locator('[data-tour="save-status"]')).toHaveText('等待自动保存');
  await expect.poll(async () => page.evaluate(() => {
    const writes = (window as unknown as { __jsonHelperSavedWrites: string[] }).__jsonHelperSavedWrites;
    return writes.at(-1) ?? null;
  })).toBe('{"saved":2}');

  await expect(dirtyCloseButton).toHaveCount(0);
  await expect(page.getByRole('button', { name: '关闭标签 autosave.json' })).toHaveAttribute('title', '关闭标签 autosave.json');
  await expect(page.locator('[data-tour="save-status"]')).toHaveText('自动保存已同步');
});

test('自动保存挂起时手动保存排队并最终落盘最新内容', async ({ page }) => {
  await page.evaluate(() => {
    const writes = (window as unknown as { __jsonHelperSavedWrites: string[] }).__jsonHelperSavedWrites;
    let writeCount = 0;
    let releaseFirstWrite = () => undefined;

    Object.defineProperty(window, '__releaseFirstAutoSaveWrite', {
      configurable: true,
      value: () => releaseFirstWrite(),
    });
    Object.defineProperty(window, 'showOpenFilePicker', {
      configurable: true,
      value: async () => [{
        name: 'autosave-queue.json',
        getFile: async () => new File(['{"saved":1}'], 'autosave-queue.json', { type: 'application/json' }),
        createWritable: async () => ({
          write: async (content: string) => {
            writeCount += 1;
            writes.push(`开始:${String(content)}`);
            if (writeCount === 1) {
              await new Promise<void>(resolve => {
                releaseFirstWrite = resolve;
              });
            }
            writes.push(`完成:${String(content)}`);
          },
          close: async () => undefined,
        }),
      }],
    });
  });

  await page.locator('[data-tour="open-file-button"]').click();
  await expect(page.getByText('autosave-queue.json').first()).toBeVisible();
  await page.locator('[data-tour="auto-save"]').click();

  await fillSourceEditor(page, '{"saved":2}');
  await expect.poll(async () => page.evaluate(() => {
    const writes = (window as unknown as { __jsonHelperSavedWrites: string[] }).__jsonHelperSavedWrites;
    return writes.at(-1) ?? null;
  })).toBe('开始:{"saved":2}');

  await fillSourceEditor(page, '{"saved":3}');
  await page.locator('[data-tour="save-file-button"]').click();
  await page.waitForTimeout(200);
  await expect.poll(async () => page.evaluate(() => {
    const writes = (window as unknown as { __jsonHelperSavedWrites: string[] }).__jsonHelperSavedWrites;
    return writes.includes('开始:{"saved":3}');
  })).toBe(false);

  await page.evaluate(() => {
    (window as unknown as { __releaseFirstAutoSaveWrite: () => void }).__releaseFirstAutoSaveWrite();
  });
  await expect.poll(async () => page.evaluate(() => {
    const writes = (window as unknown as { __jsonHelperSavedWrites: string[] }).__jsonHelperSavedWrites;
    return writes.at(-1) ?? null;
  })).toBe('完成:{"saved":3}');
  await expect(page.locator('[data-tour="save-status"]')).toHaveText('自动保存已同步');
});

test('手动保存 PREVIEW 时取消尚未入队的旧 SOURCE 自动保存', async ({ page }) => {
  await page.evaluate(() => {
    const writes = (window as unknown as { __jsonHelperSavedWrites: string[] }).__jsonHelperSavedWrites;
    let releasePreviewWrite = () => undefined;
    Object.defineProperty(window, '__releasePreviewWrite', {
      configurable: true,
      value: () => releasePreviewWrite(),
    });
    Object.defineProperty(window, 'showOpenFilePicker', {
      configurable: true,
      value: async () => [{
        name: 'autosave-preview.json',
        getFile: async () => new File(['{"saved":1}'], 'autosave-preview.json', {
          type: 'application/json',
        }),
        createWritable: async () => ({
          write: async (content: string) => {
            writes.push(`开始:${String(content)}`);
            await new Promise<void>(resolve => {
              releasePreviewWrite = resolve;
            });
            writes.push(`完成:${String(content)}`);
          },
          close: async () => undefined,
        }),
      }],
    });
  });

  await page.locator('[data-tour="open-file-button"]').click();
  await expect(page.getByText('autosave-preview.json').first()).toBeVisible();
  await page.getByRole('button', { name: '格式化' }).click();
  await page.locator('[data-tour="auto-save"]').click();
  await fillSourceEditor(page, '{"saved":2}');

  await page.locator('[data-tour="preview-editor"] .monaco-editor').first().click();
  await page.keyboard.press(`${process.platform === 'darwin' ? 'Meta' : 'Control'}+S`);
  await expect.poll(async () => page.evaluate(() => {
    const writes = (window as unknown as { __jsonHelperSavedWrites: string[] }).__jsonHelperSavedWrites;
    return writes.filter(write => write.startsWith('开始:')).length;
  })).toBe(1);
  await expect.poll(async () => page.evaluate(() => {
    const writes = (window as unknown as { __jsonHelperSavedWrites: string[] }).__jsonHelperSavedWrites;
    return writes.find(write => write.startsWith('开始:')) ?? '';
  })).toContain('"saved": 2');

  await page.waitForTimeout(1200);
  await expect.poll(async () => page.evaluate(() => {
    const writes = (window as unknown as { __jsonHelperSavedWrites: string[] }).__jsonHelperSavedWrites;
    return writes.filter(write => write.startsWith('开始:')).length;
  })).toBe(1);
  await page.evaluate(() => {
    (window as unknown as { __releasePreviewWrite: () => void }).__releasePreviewWrite();
  });
  await expect.poll(async () => page.evaluate(() => {
    const writes = (window as unknown as { __jsonHelperSavedWrites: string[] }).__jsonHelperSavedWrites;
    return writes.filter(write => write.startsWith('完成:')).length;
  })).toBe(1);
});

test('自动保存开关提供明确反馈', async ({ page }) => {
  await page.locator('[data-tour="auto-save"]').click();
  await expect(page.getByText('请先打开或保存文件后再启用自动保存')).toBeVisible();
  await expect(page.locator('[data-tour="save-status"]')).toHaveText('空白草稿');

  await fillSourceEditor(page, '{"draft":true}');
  await expect(page.locator('[data-tour="save-status"]')).toHaveText('草稿未保存');

  await page.getByTitle('新建标签 (Cmd+N)').click();
  await expect(page.locator('[data-tour="save-status"]')).toHaveText('未保存标签');

  await page.locator('[data-tour="auto-save"]').click();
  await expect(page.getByText('请先保存当前标签后再启用自动保存')).toBeVisible();

  await page.locator('[data-tour="open-file-button"]').click();
  await expect(page.getByText('autosave.json').first()).toBeVisible();

  await page.locator('[data-tour="auto-save"]').click();
  await expect(page.getByText('自动保存已开启')).toBeVisible();

  await page.locator('[data-tour="auto-save"]').click();
  await expect(page.getByText('自动保存已关闭')).toBeVisible();
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
