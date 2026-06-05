import { readFile } from 'node:fs/promises';
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

  await page.route('**/mock-ai/chat/completions', async route => {
    const body = route.request().postDataJSON() as {
      messages?: Array<{ content?: string }>;
    };
    const userPrompt = body.messages?.find(message => message.content?.includes('Repair this malformed JSON'))?.content || '';

    if (userPrompt.includes('{connection:true}')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [
            {
              message: {
                content: '{"connection":true}',
              },
            },
          ],
        }),
      });
      return;
    }

    await expect(userPrompt).toContain('{items:[1,2], ok:true}');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        choices: [
          {
            message: {
              content: '{"items":[1,2],"ok":true}',
            },
          },
        ],
      }),
    });
  });

  await page.addInitScript((featureTourIds: string[]) => {
    Object.defineProperty(window, 'showOpenFilePicker', { value: undefined, configurable: true });
    Object.defineProperty(window, 'showSaveFilePicker', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text: string) => {
          window.localStorage.setItem('mock-clipboard', text);
        },
      },
      configurable: true,
    });

    window.localStorage.setItem('json-helper-onboarding-completed', 'true');
    window.localStorage.setItem('json-helper-ai-config', JSON.stringify({
      provider: 'custom',
      apiKey: 'mock-api-key',
      model: 'mock-json-repair',
      baseUrl: '/mock-ai',
    }));

    featureTourIds.forEach(featureId => {
      window.localStorage.setItem(`json-helper-feature-tour-${featureId}`, 'completed');
    });
  }, FEATURE_TOUR_IDS);

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('JSON 工具箱')).toBeVisible();
  await expect(page.locator('[data-tour="source-editor"] .monaco-editor')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-tour="preview-editor"] .monaco-editor')).toBeVisible({ timeout: 30_000 });
});

test('格式化与压缩主路径可用', async ({ page }) => {
  await fillSourceEditor(page, '{"b":2,"a":1}');

  await page.getByRole('button', { name: '格式化' }).click();
  await expectPreviewText(page, '"b": 2');
  await expectPreviewText(page, '"a": 1');

  await page.getByRole('button', { name: '压缩 / 去空格' }).click();
  await expectPreviewText(page, '{"b":2,"a":1}');
});

test('损坏的本地配置不会阻止应用启动', async ({ page }) => {
  await page.evaluate(() => {
    window.localStorage.setItem('json-helper-general-settings', '{bad');
    window.localStorage.setItem('json-helper-ai-config', 'null');
    window.localStorage.setItem('json-helper-shortcuts', '{"SAVE":null}');
    window.localStorage.setItem('json-helper-template-fill', '{"template":123}');
    window.localStorage.setItem('jsonpath-panel-position', '"bad"');
    window.localStorage.setItem('jsonpath-panel-size', '{"width":"bad"}');
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText('JSON 工具箱')).toBeVisible();
  await expect(page.locator('[data-tour="source-editor"] .monaco-editor')).toBeVisible({ timeout: 30_000 });

  await page.locator('[data-tour="settings"]').click();
  await page.getByRole('button', { name: 'AI 配置' }).click();
  await expect(page.getByText('AI 提供商')).toBeVisible();
});

test('本地存储写入异常不会打断主路径', async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(Storage.prototype, 'setItem', {
      value: () => {
        throw new Error('storage blocked');
      },
      configurable: true,
    });
    Object.defineProperty(Storage.prototype, 'removeItem', {
      value: () => {
        throw new Error('storage blocked');
      },
      configurable: true,
    });
  });

  await page.locator('[data-tour="settings"]').click();
  await page.getByRole('button', { name: '通用设置' }).click();
  const generalSettingCard = page
    .getByText('嵌套解析时自动展开 CMD/Scheme 字符串')
    .locator('xpath=ancestor::div[contains(@class, "bg-editor-bg")][1]');
  await generalSettingCard.locator('button').click();
  await page.getByRole('button', { name: '保存设置' }).click();
  await expect(page.getByText('JSON 工具箱')).toBeVisible();

  await fillSourceEditor(page, '{"users":[{"name":"Ada"}]}');
  await page.getByRole('button', { name: 'JSONPath 查询' }).click();
  await page.locator('[data-tour="jsonpath-input"]').fill('$.users[*].name');
  await page.getByRole('button', { name: '查询', exact: true }).click();

  await expect(page.getByText('1 / 1')).toBeVisible();
  await expectPreviewText(page, '"name": "Ada"');
});

test('离屏面板缓存会被拉回可见区域', async ({ page }) => {
  await page.evaluate(() => {
    window.localStorage.setItem('jsonpath-panel-position', JSON.stringify({ x: 99999, y: 99999 }));
    window.localStorage.setItem('jsonpath-panel-size', JSON.stringify({ width: 5000, height: 4000 }));
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'JSONPath 查询' }).click();

  const panel = page.locator('[data-tour="jsonpath-panel"]');
  await expect(panel).toBeVisible();

  const box = await panel.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();

  expect(box!.x).toBeLessThanOrEqual(viewport!.width - 80);
  expect(box!.x + box!.width).toBeGreaterThanOrEqual(80);
  expect(box!.y).toBeLessThanOrEqual(viewport!.height - 80);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.width).toBeLessThanOrEqual(viewport!.width);
  expect(box!.height).toBeLessThanOrEqual(viewport!.height);

  await page.setViewportSize({ width: 900, height: 600 });
  await expect.poll(async () => {
    const resizedBox = await panel.boundingBox();
    return Boolean(
      resizedBox &&
      resizedBox.x <= 900 - 80 &&
      resizedBox.x + resizedBox.width >= 80 &&
      resizedBox.y <= 600 - 80 &&
      resizedBox.y >= 0 &&
      resizedBox.width <= 900 &&
      resizedBox.height <= 600
    );
  }).toBe(true);
});

test('设置中可恢复浮动面板默认布局', async ({ page }) => {
  await page.evaluate(() => {
    window.localStorage.setItem('jsonpath-panel-position', JSON.stringify({ x: 420, y: 260 }));
    window.localStorage.setItem('jsonpath-panel-size', JSON.stringify({ width: 820, height: 520 }));
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('[data-tour="settings"]').click();
  await page.getByRole('button', { name: '通用设置' }).click();
  await page.getByRole('button', { name: '恢复默认布局' }).click();
  await expect(page.getByText('浮动面板布局已恢复默认')).toBeVisible();
  await page.getByRole('button', { name: '取消' }).click();

  await page.getByRole('button', { name: 'JSONPath 查询' }).click();
  const box = await page.locator('[data-tour="jsonpath-panel"]').boundingBox();
  expect(box).not.toBeNull();
  expect(Math.round(box!.x)).toBe(100);
  expect(Math.round(box!.y)).toBe(100);
  expect(Math.round(box!.width)).toBe(600);
  expect(Math.round(box!.height)).toBe(400);
});

test('设置中可导出并导入配置备份', async ({ page }) => {
  await page.evaluate(() => {
    window.localStorage.setItem('jsonpath-query-favorites', JSON.stringify(['$.exported']));
    window.localStorage.setItem('json-helper-template-fill', JSON.stringify({
      template: '{"before":1}',
      lastUpdated: 1,
    }));
    window.localStorage.setItem('jsonpath-panel-position', JSON.stringify({ x: 220, y: 160 }));
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('[data-tour="settings"]').click();
  await page.getByRole('button', { name: '通用设置' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出配置备份' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^jsonutils-backup-.*\.json$/);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const exportedBackup = JSON.parse(await readFile(downloadPath!, 'utf-8')) as {
    settings: { ai: { apiKey: string } };
    jsonPath: { favorites: string[] };
    templateFill: { template: string };
  };
  expect(exportedBackup.settings.ai.apiKey).toBe('');
  expect(exportedBackup.jsonPath.favorites).toEqual(['$.exported']);
  expect(exportedBackup.templateFill.template).toBe('{"before":1}');

  const importedBackup = {
    app: 'jsonutils-pro',
    version: 1,
    exportedAt: '2026-06-05T00:00:00.000Z',
    settings: {
      general: { autoExpandSchemeInDeepFormat: true },
      ai: {
        provider: 'custom',
        apiKey: 'file-secret-key',
        model: 'imported-json-model',
        baseUrl: '/imported-ai',
      },
      shortcuts: {},
    },
    jsonPath: {
      history: ['$.imported'],
      favorites: ['$.importedFavorite'],
    },
    templateFill: {
      template: '{"after":2}',
      lastUpdated: 2,
    },
    panelLayout: {
      'jsonpath-panel': {
        position: { x: 300, y: 180 },
        size: { width: 650, height: 410 },
      },
    },
  };

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: '导入配置备份' }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: 'jsonutils-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(importedBackup)),
  });

  await expect(page.getByText('配置备份已导入，AI Key 已保留')).toBeVisible();
  const importedAIConfig = await page.evaluate(() => {
    return JSON.parse(window.localStorage.getItem('json-helper-ai-config') || '{}') as {
      apiKey?: string;
      model?: string;
    };
  });
  expect(importedAIConfig.apiKey).toBe('mock-api-key');
  expect(importedAIConfig.model).toBe('imported-json-model');
  const importedTemplate = await page.evaluate(() => {
    return JSON.parse(window.localStorage.getItem('json-helper-template-fill') || '{}') as {
      template?: string;
    };
  });
  expect(importedTemplate.template).toBe('{"after":2}');

  await page.getByRole('button', { name: '取消' }).click();
  await page.getByRole('button', { name: 'JSONPath 查询' }).click();
  await expect(page.locator('[data-tour="jsonpath-favorites"]')).toContainText('$.importedFavorite');

  const box = await page.locator('[data-tour="jsonpath-panel"]').boundingBox();
  expect(box).not.toBeNull();
  expect(Math.round(box!.x)).toBe(300);
  expect(Math.round(box!.y)).toBe(180);
  expect(Math.round(box!.width)).toBe(650);
  expect(Math.round(box!.height)).toBe(410);
});

test('JSONPath 面板可查询预览数据', async ({ page }) => {
  await fillSourceEditor(page, '{"users":[{"name":"Ada","age":20},{"name":"Bob","age":17}]}');

  await page.getByRole('button', { name: 'JSONPath 查询' }).click();
  await page.locator('[data-tour="jsonpath-input"]').fill('$.users[*].name');
  await page.getByRole('button', { name: '查询', exact: true }).click();

  await expect(page.getByText('1 / 2')).toBeVisible();
  await page.getByRole('button', { name: '复制全部结果' }).click();
  await expect(page.getByText('查询结果已复制')).toBeVisible();
  const copiedResult = await page.evaluate(() => window.localStorage.getItem('mock-clipboard'));
  expect(copiedResult).toBe(JSON.stringify(['Ada', 'Bob'], null, 2));

  await page.locator('[data-tour="jsonpath-favorite-toggle"]').click();
  await expect(page.locator('[data-tour="jsonpath-favorites"]')).toContainText('$.users[*].name');

  await page.locator('[data-tour="jsonpath-input"]').fill('$.users[0].age');
  await page.locator('[data-tour="jsonpath-favorite-item"]').filter({ hasText: '$.users[*].name' }).click();
  await expect(page.locator('[data-tour="jsonpath-input"]')).toHaveValue('$.users[*].name');
});

test('Scheme 面板可展开 CMD 参数串', async ({ page }) => {
  const cmdPayload = encodeURIComponent(JSON.stringify({ nid: 123, title: '标题' }));

  await page.locator('[data-tour="scheme-button"]').click();
  await page.locator('[data-tour="scheme-standalone-input"]').fill(`cmd=${cmdPayload}&from=feed`);

  const schemeResult = page.locator('[data-tour="scheme-result"] .view-lines');
  await expect(page.getByText('CMD 参数递归解析')).toBeVisible();
  await expect(schemeResult).toContainText('"cmd"');
  await expect(schemeResult).toContainText('"nid": 123');
  await expect(schemeResult).toContainText('"title": "标题"');
  await expect(schemeResult).toContainText('"from": "feed"');
});

test('AI 修复可写回有效 JSON 并展示摘要', async ({ page }) => {
  await fillSourceEditor(page, '{items:[1,2], ok:true}');

  await page.locator('[data-tour="ai-fix"]').click();

  await expect(page.getByText('AI 修复摘要')).toBeVisible();
  await expectPreviewText(page, '"items": [');
  await expectPreviewText(page, '"ok": true');
});

test('AI 配置可测试连接', async ({ page }) => {
  await page.locator('[data-tour="settings"]').click();
  await page.getByRole('button', { name: 'AI 配置' }).click();

  await page.getByRole('button', { name: '测试连接' }).click();

  await expect(page.getByText('连接测试通过')).toBeVisible();
});

test('文件打开后可修改并保存下载', async ({ page }) => {
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.locator('[data-tour="open-file-button"]').click();
  const fileChooser = await fileChooserPromise;

  await fileChooser.setFiles({
    name: 'sample.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"opened":true,"count":2}'),
  });

  await expect(page.getByText('sample.json').first()).toBeVisible();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"opened":true');

  const savedContent = '{"opened":true,"count":3,"saved":true}';
  await fillSourceEditor(page, savedContent);
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"saved":true');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-tour="save-file-button"]').click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('sample.json');
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  await expect(readFile(downloadPath!, 'utf-8')).resolves.toBe(savedContent);
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

const expectPreviewText = async (page: Page, text: string) => {
  await expect(page.locator('[data-tour="preview-editor"] .view-lines')).toContainText(text);
};
