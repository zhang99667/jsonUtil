import { readFile } from 'node:fs/promises';
import { expect, test, type Locator, type Page } from '@playwright/test';

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

const encodeBase64 = (value: string): string => (
  Buffer.from(value, 'utf8').toString('base64')
);

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

test('JSON Lines 可格式化为可读数组预览', async ({ page }) => {
  await fillSourceEditor(page, '{"id":1}\n{"id":2}');

  await page.getByRole('button', { name: '格式化' }).click();
  await expectPreviewText(page, '"id": 1');
  await expectPreviewText(page, '"id": 2');
});

test('JSON Lines 可深度格式化行内嵌套 JSON', async ({ page }) => {
  await fillSourceEditor(page, '{"payload":"{\\"nested\\":true}"}\n{"payload":"{\\"nested\\":false}"}');

  await page.getByRole('button', { name: '嵌套解析' }).click();
  await expectPreviewText(page, '"nested": true');
  await expectPreviewText(page, '"nested": false');
  await expect(page.locator('[data-tour="preview-editor"]')).toContainText('深度解析: 展开 2 处');

  await page.locator('[data-tour="transform-report-button"]').click();
  const reportPanel = page.locator('[data-tour="transform-report-panel"]');
  await expect(reportPanel).toContainText('深度解析报告');
  await expect(reportPanel).toContainText('$[0].payload');
  await expect(reportPanel).toContainText('嵌套 JSON');
  await expect(reportPanel).toContainText('解析结果: 对象: nested');
  await expect(reportPanel).toContainText('$[0].payload.nested');

  await page
    .locator('[data-tour="transform-report-row"]')
    .filter({ hasText: '$[0].payload' })
    .locator('[data-tour="transform-report-copy-path"]')
    .click();
  await expect(page.getByText('已复制路径')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toBe('$[0].payload');

  await reportPanel
    .locator('[data-tour="transform-report-decoded-path"]')
    .filter({ hasText: '$[0].payload.nested' })
    .locator('[data-tour="transform-report-copy-decoded-path"]')
    .click();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toBe('$[0].payload.nested');

  await reportPanel
    .locator('[data-tour="transform-report-decoded-path"]')
    .filter({ hasText: '$[0].payload.nested' })
    .locator('[data-tour="transform-report-copy-decoded-value"]')
    .click();
  await expect(page.getByText('已复制路径和值')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toBe('$[0].payload.nested = true');

  await page.locator('[data-tour="transform-report-filter"]').fill('$[1]');
  await expect(reportPanel).toContainText('$[1].payload');
  await expect(reportPanel).not.toContainText('$[0].payload');

  await page.locator('[data-tour="transform-report-filter"]').fill('$[0].payload.nested');
  await reportPanel
    .locator('[data-tour="transform-report-decoded-path"]')
    .filter({ hasText: '$[0].payload.nested' })
    .locator('[data-tour="transform-report-locate-decoded-path"]')
    .click();
  await expect(page.getByText('已填入 JSONPath 查询')).toBeVisible();
  await expect(reportPanel).toBeHidden();
  const jsonPathPanel = page.locator('[data-tour="jsonpath-panel"]');
  await expect(jsonPathPanel).toBeVisible();
  await expect(jsonPathPanel.locator('[data-tour="jsonpath-input"]')).toHaveValue('$[0].payload.nested');
  await expect(jsonPathPanel.locator('[data-tour="jsonpath-results"]')).toContainText('true');
});

test('深度解析报告筛选会展示隐藏内部路径', async ({ page }) => {
  const widePayload = {
    ...Object.fromEntries(Array.from({ length: 20 }, (_, index) => [`k${index}`, index])),
    target_after_display_limit: 'needle_after_display_limit',
  };
  await fillSourceEditor(page, JSON.stringify({
    payload: JSON.stringify(widePayload),
  }));

  await page.getByRole('button', { name: '嵌套解析' }).click();
  await page.locator('[data-tour="transform-report-button"]').click();

  const reportPanel = page.locator('[data-tour="transform-report-panel"]');
  await page.locator('[data-tour="transform-report-filter"]').fill('target_after_display_limit');
  const hiddenDecodedPath = reportPanel
    .locator('[data-tour="transform-report-decoded-path"]')
    .filter({ hasText: '$.payload.target_after_display_limit' });

  await expect(hiddenDecodedPath).toContainText('needle_after_display_limit');
  await hiddenDecodedPath.locator('[data-tour="transform-report-copy-decoded-value"]').click();
  await expect(page.getByText('已复制路径和值')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toBe('$.payload.target_after_display_limit = "needle_after_display_limit"');
});

test('深度解析报告展示未展开线索', async ({ page }) => {
  await fillSourceEditor(page, '{"tracking":"raw=%7B%22nid%22%3A123%7D"}');

  await page.getByRole('button', { name: '嵌套解析' }).click();
  await expect(page.locator('[data-tour="preview-editor"]')).toContainText('待检查 1');
  await expectPreviewText(page, '"tracking": "raw={\\"nid\\":123}"');

  await page.locator('[data-tour="transform-report-button"]').click();
  const reportPanel = page.locator('[data-tour="transform-report-panel"]');
  const coverage = reportPanel.locator('[data-tour="transform-report-coverage"]');
  const unresolvedSection = reportPanel.locator('[data-tour="transform-report-unresolved"]');

  await expect(coverage).toContainText('解析覆盖 50%');
  await expect(coverage).toContainText('还有 1 条疑似结构化内容未完全展开');
  await expect(unresolvedSection).toContainText('未展开线索 · 1');
  await expect(unresolvedSection).toContainText('$.tracking');
  await expect(unresolvedSection).toContainText('url-encoded');
  await expect(unresolvedSection).toContainText('已解码但未结构化');
  await expect(unresolvedSection).toContainText('下一步: 定位该字段确认是否只是普通埋点参数');
  await expect(unresolvedSection).toContainText('URL 编码内容已解码，但未展开为结构化对象');
  await unresolvedSection.getByRole('button', { name: '复制路径' }).click();
  await expect(page.getByText('已复制路径')).toBeVisible();

  await unresolvedSection.locator('[data-tour="transform-report-open-unresolved-scheme"]').click();
  await expect(page.getByText('已填入 Scheme 解析')).toBeVisible();
  await expect(reportPanel).toBeHidden();
  const schemePanel = page.locator('[data-tour="scheme-panel"]');
  await expect(schemePanel).toBeVisible();
  await expect(schemePanel.locator('[data-tour="scheme-standalone-input"]')).toHaveValue('raw=%7B%22nid%22%3A123%7D');
});

test('深度解析报告展示运行时占位符', async ({ page }) => {
  const actionCmd = `cmd=${encodeURIComponent(JSON.stringify({
    button_cmd: '__CONVERT_CMD__',
  }))}&from=feed`;
  await fillSourceEditor(page, JSON.stringify({ action_cmd: actionCmd }));

  await page.getByRole('button', { name: '嵌套解析' }).click();
  await expect(page.locator('[data-tour="preview-editor"]')).toContainText('占位符 1');
  await expectPreviewText(page, '"button_cmd": "__CONVERT_CMD__"');

  await page.locator('[data-tour="transform-report-button"]').click();
  const reportPanel = page.locator('[data-tour="transform-report-panel"]');
  const placeholderSection = reportPanel.locator('[data-tour="transform-report-placeholders"]');

  await expect(placeholderSection).toContainText('运行时占位符 · 1');
  const placeholderGroups = placeholderSection.locator('[data-tour="transform-report-placeholder-groups"]');
  await expect(placeholderGroups).toContainText('__CONVERT_CMD__');
  await expect(placeholderGroups).toContainText('1 处');
  await expect(placeholderGroups).toContainText('1 个来源');
  await expect(placeholderSection).toContainText('$.action_cmd.cmd.button_cmd');
  await expect(placeholderSection).toContainText('__CONVERT_CMD__');
  await expect(placeholderSection).toContainText('运行时转换 CMD 占位符');
  await expect(placeholderSection).toContainText('来源原始值:');
  await expect(placeholderSection).toContainText('cmd=%7B%22button_cmd');
  await reportPanel.locator('[data-tour="transform-report-filter"]').fill('__CONVERT_CMD__');
  await reportPanel.getByRole('button', { name: '复制筛选结果' }).click();
  await expect(page.getByText('已复制筛选结果')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toContain('筛选: __CONVERT_CMD__');
  await placeholderSection.locator('[data-tour="transform-report-copy-placeholders"]').click();
  await expect(page.getByText('已复制筛选占位符')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toContain('占位符: 1/1');
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toContain('$.action_cmd.cmd.button_cmd: __CONVERT_CMD__');
  await placeholderSection.getByRole('button', { name: '复制路径' }).click();
  await expect(page.getByText('已复制路径')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toBe('$.action_cmd.cmd.button_cmd');

  await placeholderSection.getByRole('button', { name: '复制来源' }).click();
  await expect(page.getByText('已复制来源路径')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toBe('$.action_cmd');

  await placeholderSection.locator('[data-tour="transform-report-open-placeholder-source-scheme"]').click();
  await expect(page.getByText('已填入 Scheme 解析')).toBeVisible();
  await expect(reportPanel).toBeHidden();
  const schemePanel = page.locator('[data-tour="scheme-panel"]');
  await expect(schemePanel).toBeVisible();
  await expect(schemePanel.locator('[data-tour="scheme-standalone-input"]')).toHaveValue(actionCmd);
});

test('JSON Lines 校验错误展示具体行号', async ({ page }) => {
  await fillSourceEditor(page, '{"ok":1}\n{"broken":}\n{"ok":3}');

  await expect(page.getByText('JSON Lines 第 2 行解析错误')).toBeVisible();
});

test('预览复制在 Clipboard API 不可用时可回退复制', async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    document.execCommand = (command: string) => {
      if (command !== 'copy') return false;
      const activeElement = document.activeElement as HTMLTextAreaElement | null;
      window.localStorage.setItem('mock-clipboard', activeElement?.value || '');
      return true;
    };
  });

  await fillSourceEditor(page, '{"copy":true}');
  await page.getByRole('button', { name: '格式化' }).click();
  await expectPreviewText(page, '"copy": true');

  await page.getByRole('button', { name: '复制' }).click();
  await expect(page.getByText('已复制预览内容')).toBeVisible();
  const copiedResult = await page.evaluate(() => window.localStorage.getItem('mock-clipboard'));
  expect(copiedResult).toContain('"copy": true');
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

test('本地存储读取异常不会阻止应用启动', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, 'getItem', {
      value: () => {
        throw new Error('storage read blocked');
      },
      configurable: true,
    });
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText('JSON 工具箱')).toBeVisible();
  await expect(page.locator('[data-tour="source-editor"] .monaco-editor')).toBeVisible({ timeout: 30_000 });

  await fillSourceEditor(page, '{"read":"safe"}');
  await page.getByRole('button', { name: '格式化' }).click();
  await expectPreviewText(page, '"read": "safe"');
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
  await page.locator('[data-tour="jsonpath-input"]').fill('   ');
  await page.getByRole('button', { name: '查询', exact: true }).click();
  await expect(page.getByText('请输入 JSONPath 表达式')).toBeVisible();

  await page.locator('[data-tour="jsonpath-input"]').fill('$.users[*].name');
  await page.getByRole('button', { name: '查询', exact: true }).click();

  await expect(page.getByText('1 / 2')).toBeVisible();
  await expect(page.locator('.jsonpath-highlight').first()).toBeVisible();
  const resultPreview = page.locator('[data-tour="jsonpath-results"]');
  await expect(resultPreview).toContainText('Ada');
  await expect(resultPreview).toContainText('Bob');
  await resultPreview.locator('button').nth(1).click();
  await expect(page.getByText('2 / 2')).toBeVisible();

  await page.getByRole('button', { name: '复制全部结果' }).click();
  await expect(page.getByText('查询结果已复制')).toBeVisible();
  const copiedResult = await page.evaluate(() => window.localStorage.getItem('mock-clipboard'));
  expect(copiedResult).toBe(JSON.stringify(['Ada', 'Bob'], null, 2));

  await page.locator('[data-tour="jsonpath-copy-path-values"]').click();
  await expect(page.getByText('查询路径和值已复制')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toBe('$.users[0].name = "Ada"\n$.users[1].name = "Bob"');

  await page.locator('[data-tour="jsonpath-favorite-toggle"]').click();
  await expect(page.locator('[data-tour="jsonpath-favorites"]')).toContainText('$.users[*].name');

  await page.locator('[data-tour="jsonpath-input"]').fill('$.users[0].age');
  await page.locator('[data-tour="jsonpath-favorite-item"]').filter({ hasText: '$.users[*].name' }).click();
  await expect(page.locator('[data-tour="jsonpath-input"]')).toHaveValue('$.users[*].name');

  await page.locator('[data-tour="jsonpath-panel"] button[title="关闭"]').click();
  await expect(page.locator('[data-tour="jsonpath-panel"]')).toBeHidden();
  await expect(page.locator('.jsonpath-highlight')).toHaveCount(0);
});

test('JSONPath 面板可查询 JSON Lines 输入', async ({ page }) => {
  await fillSourceEditor(page, '{"level":"info","user":{"id":1}}\n  {"level":"error","user":{"id":2}}');

  await page.getByRole('button', { name: 'JSONPath 查询' }).click();
  await page.getByRole('button', { name: '查询', exact: true }).click();

  await expect(page.getByText('1 / 1')).toBeVisible();
  await expect(page.locator('.jsonpath-highlight').first()).toBeVisible();
  const resultPreview = page.locator('[data-tour="jsonpath-results"]');
  await expect(resultPreview).toContainText('"level": "info"');
  await expect(resultPreview).toContainText('"level": "error"');

  await page.locator('[data-tour="jsonpath-input"]').fill('$[*].user.id');
  await page.getByRole('button', { name: '查询', exact: true }).click();

  await expect(page.getByText('1 / 2')).toBeVisible();
  await expect(resultPreview).toContainText('1');
  await expect(resultPreview).toContainText('2');
});

test('Scheme 面板可展开 CMD 参数串', async ({ page }) => {
  const cmdPayload = encodeURIComponent(JSON.stringify({ nid: 123, title: '标题' }));

  await page.evaluate(() => {
    window.localStorage.setItem('scheme-panel-position', JSON.stringify({ x: 80, y: 80 }));
    window.localStorage.setItem('scheme-panel-size', JSON.stringify({ width: 450, height: 520 }));
  });
  await page.locator('[data-tour="scheme-button"]').click();
  await page.locator('[data-tour="scheme-standalone-input"]').fill(`cmd=${cmdPayload}&from=feed`);

  const schemeResult = page.locator('[data-tour="scheme-result"] .view-lines');
  await expect(page.getByText('CMD 参数递归解析')).toBeVisible();
  await expect(schemeResult).toContainText('"cmd"');
  await expect(schemeResult).toContainText('"nid": 123');
  await expect(schemeResult).toContainText('"title": "标题"');
  await expect(schemeResult).toContainText('"from": "feed"');

  await fillMonacoEditor(
    page,
    page.locator('[data-tour="scheme-result"] .monaco-editor').first(),
    '{"cmd":{"nid":456,"title":"标题"},"from":"feed"}'
  );
  const schemePanel = page.locator('[data-tour="scheme-panel"]');
  await expectElementInside(page.locator('[data-tour="scheme-copy-serialized"]'), schemePanel);
  await expectElementInside(page.getByRole('button', { name: '应用修改' }), schemePanel);
  await page.locator('[data-tour="scheme-copy-serialized"]').click();
  await expect(page.getByText('已复制序列化结果')).toBeVisible();
  const serializedResult = await page.evaluate(() => window.localStorage.getItem('mock-clipboard'));
  expect(serializedResult).toContain('cmd=%7B%22nid%22%3A456');
  expect(serializedResult).toContain('from=feed');

  await fillMonacoEditor(page, page.locator('[data-tour="scheme-result"] .monaco-editor').first(), '{"cmd":');
  await expect(page.getByText('Invalid JSON')).toBeVisible();
  await expect(page.locator('[data-tour="scheme-json-edit-error"]')).toContainText('JSON 内容格式有误');
});

test('Scheme 面板展示运行时占位符聚合摘要', async ({ page }) => {
  const cmdPayload = encodeURIComponent(JSON.stringify({
    first_cmd: '__CONVERT_CMD__',
    second_cmd: '__CONVERT_CMD__',
    webpanel_cmd: '__WEBPANEL_CMD__',
  }));

  await page.evaluate(() => {
    window.localStorage.setItem('scheme-panel-position', JSON.stringify({ x: 80, y: 80 }));
    window.localStorage.setItem('scheme-panel-size', JSON.stringify({ width: 500, height: 520 }));
  });
  await page.locator('[data-tour="scheme-button"]').click();
  await page.locator('[data-tour="scheme-standalone-input"]').fill(`cmd=${cmdPayload}&from=feed`);

  const placeholderSection = page.locator('[data-tour="scheme-runtime-placeholders"]');
  await expect(placeholderSection).toContainText('运行时占位符 · 3');
  const placeholderGroups = placeholderSection.locator('[data-tour="scheme-runtime-placeholder-groups"]');
  await expect(placeholderGroups).toContainText('__CONVERT_CMD__ ×2');
  await expect(placeholderGroups).toContainText('__WEBPANEL_CMD__ ×1');
  await expect(placeholderSection).toContainText('路径明细');
  await expect(placeholderSection).toContainText('$.cmd.first_cmd=__CONVERT_CMD__');
});

test('Scheme 面板可复制特殊 key 来源路径', async ({ page }) => {
  await fillSourceEditor(page, JSON.stringify({
    'a.b': {
      'x/y': {
        'tilde~key': 'https://example.com/path?from=key',
      },
    },
  }));
  await page.getByRole('button', { name: '格式化' }).click();
  await expectPreviewText(page, '"tilde~key": "https://example.com/path?from=key"');

  await page.locator('[data-tour="preview-editor"] .scheme-inline-highlight').first().click();
  const schemePanel = page.locator('[data-tour="scheme-panel"]');
  await expect(schemePanel).toContainText('Scheme 解析');
  await expect(page.locator('[data-tour="scheme-source-path"]')).toContainText('$["a.b"]["x/y"]["tilde~key"]');

  await page.locator('[data-tour="scheme-copy-path"]').click();
  await expect(page.getByText('已复制路径')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toBe('$["a.b"]["x/y"]["tilde~key"]');
});

test('Scheme 面板可解析 JSON-like CMD 参数', async ({ page }) => {
  await page.locator('[data-tour="scheme-button"]').click();
  await page.locator('[data-tour="scheme-standalone-input"]').fill("cmd=%7Bnid%3A123%2Ctitle%3A'标题'%7D&from=feed");

  const schemeResult = page.locator('[data-tour="scheme-result"] .view-lines');
  await expect(schemeResult).toContainText('"cmd"');
  await expect(schemeResult).toContainText('"nid": 123');
  await expect(schemeResult).toContainText('"title": "标题"');
  await expect(schemeResult).toContainText('"from": "feed"');
});

test('Scheme 面板可解析多行 CMD 参数串', async ({ page }) => {
  const cmdPayload = encodeURIComponent(JSON.stringify({ nid: 123 }));

  await page.locator('[data-tour="scheme-button"]').click();
  await page.locator('[data-tour="scheme-standalone-input"]').fill(`cmd=${cmdPayload}\n  from=line`);

  const schemeResult = page.locator('[data-tour="scheme-result"] .view-lines');
  await expect(schemeResult).toContainText('"cmd"');
  await expect(schemeResult).toContainText('"nid": 123');
  await expect(schemeResult).toContainText('"from": "line"');
});

test('Scheme 面板可解析 Unicode 转义分隔符 CMD 参数串', async ({ page }) => {
  const cmdPayload = encodeURIComponent(JSON.stringify({ nid: 123 }));

  await page.locator('[data-tour="scheme-button"]').click();
  await page.locator('[data-tour="scheme-standalone-input"]').fill(`cmd=${cmdPayload}\\u0026from=unicode`);

  const schemeResult = page.locator('[data-tour="scheme-result"] .view-lines');
  await expect(schemeResult).toContainText('"cmd"');
  await expect(schemeResult).toContainText('"nid": 123');
  await expect(schemeResult).toContainText('"from": "unicode"');
});

test('Scheme 面板可解析独立 hash route CMD 参数', async ({ page }) => {
  const cmdPayload = encodeURIComponent(JSON.stringify({ nid: 123, title: '标题' }));

  await page.locator('[data-tour="scheme-button"]').click();
  await page.locator('[data-tour="scheme-standalone-input"]').fill(`#/detail?cmd=${cmdPayload}&from=hash`);

  const schemeResult = page.locator('[data-tour="scheme-result"] .view-lines');
  await expect(schemeResult).toContainText('"cmd"');
  await expect(schemeResult).toContainText('"nid": 123');
  await expect(schemeResult).toContainText('"title": "标题"');
  await expect(schemeResult).toContainText('"from": "hash"');
});

test('Scheme 面板展示 URL 参数来源', async ({ page }) => {
  const cmdPayload = encodeURIComponent(JSON.stringify({ nid: 123 }));

  await page.locator('[data-tour="scheme-button"]').click();
  await page.locator('[data-tour="scheme-standalone-input"]').fill(`https://example.com/page?from=feed#/detail?cmd=${cmdPayload}`);

  const paramSections = page.locator('[data-tour="scheme-param-sections"]');
  await expect(paramSections).toContainText('Query 参数 · 1');
  await expect(paramSections).toContainText('from=feed');
  await expect(paramSections).toContainText('Hash 参数 · 1');
  await expect(paramSections).toContainText('cmd={"nid":123}');

  const commandSummary = page.locator('[data-tour="scheme-command-summary"]');
  await expect(commandSummary).toContainText('CMD 结构');
  await expect(commandSummary).toContainText('cmdSchema=https://example.com/page');
  await expect(commandSummary).toContainText('cmdParams · 2');
  await expect(commandSummary).toContainText('cmd解析: cmd');
});

test('Scheme 面板展示内部 Base64 后缀摘要', async ({ page }) => {
  const suffix = 'UxMJm9zPTImaXA9MTI3LjAuMC4x';
  const encoded = `AFD8f${encodeBase64('{"meg_name":"AI","flag":true}')}${suffix}`;

  await page.locator('[data-tour="scheme-button"]').click();
  await page.locator('[data-tour="scheme-standalone-input"]').fill(encoded);

  const base64Meta = page.locator('[data-tour="scheme-base64-meta"]');
  await expect(base64Meta).toContainText('内部 Base64');
  await expect(base64Meta).toContainText('头部=AFD8f');
  await expect(base64Meta).toContainText('跳过=UxM');
  await expect(base64Meta).toContainText('os=2');
  await expect(base64Meta).toContainText('ip=127.0.0.1');
});

test('AI 修复可写回有效 JSON 并展示摘要', async ({ page }) => {
  await fillSourceEditor(page, '{items:[1,2], ok:true}');

  await page.locator('[data-tour="ai-fix"]').click();

  await expect(page.getByText('AI 修复摘要')).toBeVisible();
  await expectPreviewText(page, '"items": [');
  await expectPreviewText(page, '"ok": true');
});

test('AI 修复空输入会提示用户', async ({ page }) => {
  await page.locator('[data-tour="ai-fix"]').click();

  await expect(page.getByText('请先输入需要修复的 JSON 内容')).toBeVisible();
});

test('AI 修复缺少 Key 会引导到配置页', async ({ page }) => {
  await page.locator('[data-tour="settings"]').click();
  await page.getByRole('button', { name: 'AI 配置' }).click();
  await page.locator('input[type="password"]').fill('');
  await page.getByRole('button', { name: '保存设置' }).click();

  await fillSourceEditor(page, '{items:[1,2], ok:true}');
  await page.locator('[data-tour="ai-fix"]').click();

  await expect(page.getByText('请先配置 AI API Key')).toBeVisible();
  await expect(page.getByText('AI 提供商')).toBeVisible();
  await expect(page.getByRole('button', { name: '保存设置' })).toBeVisible();
});

test('AI 配置可测试连接', async ({ page }) => {
  await page.locator('[data-tour="settings"]').click();
  await page.getByRole('button', { name: 'AI 配置' }).click();

  await page.getByRole('button', { name: '测试连接' }).click();

  await expect(page.getByText('连接测试通过')).toBeVisible();

  await page.locator('input[type="password"]').fill('changed-key');
  await expect(page.getByText('连接测试通过')).toHaveCount(0);
});

test('自定义 AI 配置缺少 Base URL 时阻止保存', async ({ page }) => {
  await page.locator('[data-tour="settings"]').click();
  await page.getByRole('button', { name: 'AI 配置' }).click();

  await page.locator('select').selectOption('custom');
  await page.locator('input[type="text"]').nth(1).fill('');
  await page.getByRole('button', { name: '保存设置' }).click();

  await expect(page.getByText('自定义 AI 提供商需要填写 Base URL')).toBeVisible();
  await expect(page.getByRole('button', { name: '保存设置' })).toBeVisible();

  const aiConfig = await page.evaluate(() => JSON.parse(window.localStorage.getItem('json-helper-ai-config') || '{}') as {
    baseUrl?: string;
  });
  expect(aiConfig.baseUrl).toBe('/mock-ai');
});

test('模板填充会提前提示 SOURCE 前置条件', async ({ page }) => {
  await page.locator('[data-tour="template-fill-button"]').click();
  await fillMonacoEditor(
    page,
    page.locator('[data-tour="template-fill-panel"] .monaco-editor').first(),
    '{"name":"new"}'
  );

  await expect(page.getByText('请先在 SOURCE 输入合法 JSON')).toBeVisible();
  await expect(page.getByRole('button', { name: '应用模板到当前 JSON' })).toBeDisabled();
});

test('模板填充可格式化模板并应用', async ({ page }) => {
  await fillSourceEditor(page, '{"name":"old","keep":true}');

  await page.locator('[data-tour="template-fill-button"]').click();
  await fillMonacoEditor(
    page,
    page.locator('[data-tour="template-fill-panel"] .monaco-editor').first(),
    '{"name":"new","extra":{"enabled":true}}'
  );

  await page.locator('[data-tour="template-format-button"]').click();
  await expect(page.locator('[data-tour="template-fill-panel"] .view-lines')).toContainText('"extra": {');

  await page.getByRole('button', { name: '应用模板到当前 JSON' }).click();
  await expect(page.getByText('模板已应用')).toBeVisible();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"name": "new"');
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"keep": true');
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"enabled": true');
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

test('取消打开文件不会输出失败日志', async ({ page }) => {
  const consoleMessages: string[] = [];
  page.on('console', message => {
    consoleMessages.push(`${message.type()}: ${message.text()}`);
  });

  await page.evaluate(() => {
    Object.defineProperty(window, 'showOpenFilePicker', {
      configurable: true,
      value: async () => {
        throw new DOMException('cancelled', 'AbortError');
      },
    });
  });

  await page.locator('[data-tour="open-file-button"]').click();

  await expect(page.getByText('读取文件失败')).toHaveCount(0);
  expect(consoleMessages.filter(message => message.includes('File open') || message.includes('Failed to open file'))).toEqual([]);
});

test('取消保存预览不会提示失败', async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(window, 'showSaveFilePicker', {
      configurable: true,
      value: async () => {
        throw new DOMException('cancelled', 'AbortError');
      },
    });
  });

  await fillSourceEditor(page, '{"preview":true}');
  await page.getByRole('button', { name: '格式化' }).click();
  await page.locator('[data-tour="preview-editor"] .monaco-editor').click();
  await page.locator('[data-tour="save-file-button"]').click();

  await expect(page.getByText('保存预览结果失败')).toHaveCount(0);
});

const fillSourceEditor = async (page: Page, value: string) => {
  const sourceEditor = page.locator('[data-tour="source-editor"] .monaco-editor').first();
  await fillMonacoEditor(page, sourceEditor, value);
};

const fillMonacoEditor = async (page: Page, editor: Locator, value: string) => {
  const selectAllShortcut = `${process.platform === 'darwin' ? 'Meta' : 'Control'}+A`;
  await editor.click();
  await page.keyboard.press(selectAllShortcut);
  await page.keyboard.press(selectAllShortcut);
  await page.keyboard.press('Backspace');
  await page.keyboard.insertText(value);
};

const expectPreviewText = async (page: Page, text: string) => {
  await expect(page.locator('[data-tour="preview-editor"] .view-lines')).toContainText(text);
};

const expectElementInside = async (element: Locator, container: Locator) => {
  await expect(element).toBeVisible();
  const [elementBox, containerBox] = await Promise.all([
    element.boundingBox(),
    container.boundingBox(),
  ]);

  expect(elementBox).not.toBeNull();
  expect(containerBox).not.toBeNull();
  expect(elementBox!.x).toBeGreaterThanOrEqual(containerBox!.x - 1);
  expect(elementBox!.y).toBeGreaterThanOrEqual(containerBox!.y - 1);
  expect(elementBox!.x + elementBox!.width).toBeLessThanOrEqual(containerBox!.x + containerBox!.width + 1);
  expect(elementBox!.y + elementBox!.height).toBeLessThanOrEqual(containerBox!.y + containerBox!.height + 1);
};
