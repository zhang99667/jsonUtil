import { readFile } from 'node:fs/promises';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { FEATURE_TOUR_IDS, gotoMainApp, openMainApp, waitForEditorReady, waitForMainAppReady } from './helpers/appReady';

const encodeBase64 = (value: string): string => (
  Buffer.from(value, 'utf8').toString('base64')
);

const encodeBase64Url = (value: string): string => (
  encodeBase64(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
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

    await expect(userPrompt).toContain('{items:[1,2], ok:}');
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
        readText: async () => window.localStorage.getItem('mock-clipboard') || '',
      },
      configurable: true,
    });

    window.localStorage.setItem('json-helper-onboarding-completed', 'true');
    window.localStorage.setItem('json-helper-ai-config', JSON.stringify({
      provider: 'custom',
      apiKey: 'mock-api-key',
      model: 'mock-json-repair',
      baseUrl: `${window.location.origin}/mock-ai`,
    }));

    featureTourIds.forEach(featureId => {
      window.localStorage.setItem(`json-helper-feature-tour-${featureId}`, 'completed');
    });
  }, FEATURE_TOUR_IDS);

  await openMainApp(page, { waitForSourceEditor: false, waitForPreviewEditor: false });
});

test('格式化与压缩主路径可用', async ({ page }) => {
  await fillSourceEditor(page, '{"b":2,"a":1}');

  await expect(page.getByRole('button', { name: /原始视图/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '格式化' }).click();
  await expect(page.getByRole('button', { name: /格式化/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: /原始视图/ })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-tour="active-mode-badge"]')).toContainText('当前');
  await expectPreviewText(page, '"b": 2');
  await expectPreviewText(page, '"a": 1');

  await page.getByRole('button', { name: '压缩 / 去空格' }).click();
  await expect(page.getByRole('button', { name: /压缩 \/ 去空格/ })).toHaveAttribute('aria-pressed', 'true');
  await expectPreviewText(page, '{"b":2,"a":1}');
});

test('JSON 转 TS 可生成接口声明', async ({ page }) => {
  await fillSourceEditor(page, JSON.stringify({
    user: {
      id: 1,
      name: 'Ada',
    },
    items: [
      { id: 1, title: 'first' },
      { id: 2, active: true },
    ],
  }));

  await page.locator('[data-tour="json-to-ts-btn"]').click();

  await expect(page.getByRole('button', { name: /JSON 转 TS/ })).toHaveAttribute('aria-pressed', 'true');
  await expectPreviewText(page, '生成说明: 基于单个对象样本推断');
  await expectPreviewText(page, '可信提示: 2 个可选字段');
  await expectPreviewText(page, 'export interface Root');
  await expectPreviewText(page, 'user: RootUser;');
  await expectPreviewText(page, 'items: RootItemsItem[];');
  await expectPreviewText(page, 'title?: string;');
  await expectPreviewText(page, 'active?: boolean;');
});

test('智能建议会根据 SOURCE 推荐下一步动作', async ({ page }) => {
  const businessScheme = 'sampleapp://v7/vendor/ad/makePhoneCall?params=%7B%22phone%22%3A%2213718164578%22%7D';
  await fillSourceEditor(page, JSON.stringify({
    data: {
      action_cmd: businessScheme,
    },
  }));

  const suggestion = page.locator('[data-tour="smart-action-suggestion"]');
  await expect(suggestion).toContainText('检测到 JSON 内含 CMD / Scheme');
  await expect(suggestion).toContainText('高级排查');
  await expect(suggestion).toContainText('嵌套解析');
  await suggestion.locator('[data-tour="smart-action-response-inspection"]').click();

  await expect(page.locator('[data-tour="deep-format-btn"]')).toHaveAttribute('aria-pressed', 'true');
  const reportPanel = page.locator('[data-tour="transform-report-panel"]');
  await expect(reportPanel).toBeHidden();
  await page.locator('[data-tour="transform-report-button"]').click();
  await expect(reportPanel).toContainText('深度解析报告');
  await expect(reportPanel).toContainText('action_cmd');
  await reportPanel.getByRole('button', { name: '关闭 深度解析报告' }).click();

  await fillSourceEditor(page, '{"level":"info","user":{"id":1}}\n{"level":"error","user":{"id":2}}');
  await expect(suggestion).toContainText('检测到 JSON Lines / NDJSON');
  await expect(suggestion).toContainText('结构导航');
  await expect(suggestion).toContainText('转 TS');
  await expect(suggestion.locator('[data-tour="smart-action-ai-fix"]')).toHaveCount(0);

  await fillSourceEditor(page, 'https://example.com/docs?a=1&b=2');
  await expect(suggestion).toContainText('检测到普通 URL');
  await expect(suggestion).toContainText('普通 HTTP(S) 链接不会直接当成业务 Scheme');
  await expect(suggestion.locator('[data-tour="smart-action-scheme-panel"]')).toHaveCount(0);
  await suggestion.locator('[data-tour="smart-action-url-decode"]').click();
  await expect(page.locator('button[aria-pressed="true"]').filter({ hasText: 'URL 解码' })).toBeVisible();
});

test('智能粘贴会标记剪贴板来源并复用输入建议', async ({ page }) => {
  await page.evaluate(() => {
    window.localStorage.setItem('mock-clipboard', '{"level":"info","user":{"id":1}}\n{"level":"error","user":{"id":2}}');
  });

  await page.locator('[data-tour="paste-source"]').click();

  const suggestion = page.locator('[data-tour="smart-action-suggestion"]');
  await expect(suggestion.locator('[data-tour="smart-action-origin"]')).toContainText('剪贴板识别');
  await expect(suggestion).toContainText('检测到 JSON Lines / NDJSON');
  await expect(suggestion).toContainText('结构导航');
  await expect(suggestion).toContainText('转 TS');
  await expect(suggestion.locator('[data-tour="smart-action-ai-fix"]')).toHaveCount(0);

  await fillSourceEditor(page, '');
  await page.evaluate(() => {
    window.localStorage.setItem('mock-clipboard', 'https://example.com/docs?a=1&b=2');
  });
  await page.locator('[data-tour="paste-source"]').click();

  await expect(suggestion.locator('[data-tour="smart-action-origin"]')).toContainText('剪贴板识别');
  await expect(suggestion).toContainText('检测到普通 URL');
  await expect(suggestion).toContainText('普通 HTTP(S) 链接不会直接当成业务 Scheme');
  await expect(suggestion.locator('[data-tour="smart-action-scheme-panel"]')).toHaveCount(0);
  await expect(suggestion.locator('[data-tour="smart-action-url-decode"]')).toBeVisible();
});

test('JSON 对比面板可输出路径级语义差异并复制报告', async ({ page }) => {
  await fillSourceEditor(page, JSON.stringify({
    id: 1,
    name: 'old',
    keep: true,
    traceId: 'trace-old',
    meta: {
      updatedAt: '2026-06-18T10:00:00Z',
    },
  }));

  await page.locator('[data-tour="json-compare-button"]').click();

  const comparePanel = page.getByRole('dialog', { name: 'JSON 对比' });
  await expect(comparePanel).toBeVisible();

  await comparePanel.locator('[data-tour="json-compare-target-input"]').fill(JSON.stringify({
    id: 1,
    name: 'new',
    extra: 2,
    traceId: 'trace-new',
    meta: {
      updatedAt: '2026-06-19T10:00:00Z',
    },
  }));

  await expect(comparePanel.locator('[data-tour="json-compare-summary"]')).toContainText('新增 1 / 删除 1 / 修改 3');
  await comparePanel.locator('[data-tour="json-compare-ignore-paths"]').fill('$.traceId, $.meta');
  await expect(comparePanel.locator('[data-tour="json-compare-summary"]')).toContainText('新增 1 / 删除 1 / 修改 1，忽略 2 条路径');
  await expect(comparePanel.locator('[data-tour="json-compare-results"]')).toContainText('$.extra');
  await expect(comparePanel.locator('[data-tour="json-compare-results"]')).toContainText('$.keep');
  await expect(comparePanel.locator('[data-tour="json-compare-results"]')).toContainText('$.name');
  await expect(comparePanel.locator('[data-tour="json-compare-results"]')).not.toContainText('$.traceId');
  await expect(comparePanel.locator('[data-tour="json-compare-results"]')).not.toContainText('$.meta.updatedAt');

  const nameDiffRow = comparePanel.locator('[data-tour="json-compare-row"]').filter({ hasText: '$.name' });
  await nameDiffRow.locator('[data-tour="json-compare-copy-path"]').click();
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('mock-clipboard') || '')).toBe('$.name');
  await nameDiffRow.locator('[data-tour="json-compare-copy-pointer"]').click();
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('mock-clipboard') || '')).toBe('/name');
  await nameDiffRow.locator('[data-tour="json-compare-locate-source"]').click();
  const jsonPathPanel = page.getByRole('dialog', { name: 'JSONPath 查询' });
  await expect(jsonPathPanel).toBeVisible();
  await expect(jsonPathPanel.locator('[data-tour="jsonpath-input"]')).toHaveValue('$.name');
  await expect(jsonPathPanel.locator('[data-tour="jsonpath-results"]')).toContainText('old');

  const extraDiffRow = comparePanel.locator('[data-tour="json-compare-row"]').filter({ hasText: '$.extra' });
  await expect(extraDiffRow.locator('[data-tour="json-compare-locate-source"]')).toBeDisabled();

  await comparePanel.locator('[data-tour="json-compare-copy-markdown"]').click();
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('mock-clipboard') || '')).toContain('# JSON 对比报告');
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('mock-clipboard') || '')).toContain('忽略路径: `$.traceId`、`$.meta`');
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('mock-clipboard') || '')).toContain('$.name');
});

test('查询解析工具入口展示浮动面板打开态', async ({ page }) => {
  const assertPanelToggle = async (dataTour: string) => {
    const button = page.locator(`[data-tour="${dataTour}"]`);

    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(button.locator('[data-tour="panel-open-badge"]')).toContainText('打开');

    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(button.locator('[data-tour="panel-open-badge"]')).toHaveCount(0);
  };

  await assertPanelToggle('jsonpath-button');
  await assertPanelToggle('json-compare-button');
  await assertPanelToggle('structure-nav-button');
  await assertPanelToggle('json-schema-button');
  await assertPanelToggle('scheme-button');
  await assertPanelToggle('template-fill-button');
});

test('折叠工具栏后图标按钮保留可访问名称', async ({ page }) => {
  const collapseButton = page.getByRole('button', { name: '折叠工具栏' });
  await expect(collapseButton).toHaveAttribute('aria-expanded', 'true');

  await collapseButton.click();

  const expandButton = page.getByRole('button', { name: '展开工具栏' });
  await expect(expandButton).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('[data-tour="deep-format-btn"]')).toHaveAttribute('aria-label', '嵌套解析');
  await expect(page.locator('[data-tour="json-to-ts-btn"]')).toHaveAttribute('aria-label', 'JSON 转 TS');
  await expect(page.locator('[data-tour="jsonpath-button"]')).toHaveAttribute('aria-label', 'JSONPath 查询，未打开');
  await expect(page.locator('[data-tour="json-compare-button"]')).toHaveAttribute('aria-label', 'JSON 对比，未打开');
  await expect(page.locator('[data-tour="structure-nav-button"]')).toHaveAttribute('aria-label', '结构导航，未打开');
  await expect(page.locator('[data-tour="json-schema-button"]')).toHaveAttribute('aria-label', 'Schema 校验，未打开');
  await expect(page.locator('[data-tour="open-file-button"]')).toHaveAttribute('aria-label', '打开文件');
  await expect(page.locator('[data-tour="save-file-button"]')).toHaveAttribute('aria-label', '保存为 JSON');
  await expect(page.locator('[data-tour="ai-fix"]')).toHaveAttribute('aria-label', '智能修复');
  await expect(page.locator('[data-tour="settings"]')).toHaveAttribute('aria-label', '设置');
});

test('JSON Schema 面板可校验当前 SOURCE 并定位问题路径', async ({ page }) => {
  await fillSourceEditor(page, '{"id":1,"items":[{"price":0}]}');
  await page.locator('[data-tour="json-schema-button"]').click();

  const schemaPanel = page.getByRole('dialog', { name: 'JSON Schema 校验' });
  const schemaInput = schemaPanel.locator('[data-tour="json-schema-input"]');
  const orderSchema = {
    title: '订单 Schema',
    type: 'object',
    required: ['id', 'items'],
    properties: {
      id: { type: 'number' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          required: ['price'],
          properties: {
            price: { type: 'number', minimum: 1 },
          },
        },
      },
    },
  };
  await expect(schemaPanel).toBeVisible();
  await expect(schemaInput).toBeFocused();

  await schemaInput.fill(JSON.stringify(orderSchema, null, 2));
  await expect(schemaPanel.locator('[data-tour="json-schema-copy-schema"]')).toBeEnabled();
  await schemaPanel.locator('[data-tour="json-schema-copy-schema"]').click();
  await expect(page.getByText('已复制当前 Schema')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toContain('"title": "订单 Schema"');
  await expect(schemaPanel.locator('[data-tour="json-schema-copy-example"]')).toBeEnabled();
  await schemaPanel.locator('[data-tour="json-schema-copy-example"]').click();
  await expect(page.getByText('已复制 Schema 示例 JSON')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toContain('"price": 1');
  await schemaPanel.locator('[data-tour="json-schema-save"]').click();
  await expect(schemaPanel.locator('[data-tour="json-schema-library"]')).toContainText('订单 Schema');

  await schemaPanel.locator('[data-tour="json-schema-clear"]').click();
  await expect(schemaInput).toHaveValue('');
  await schemaPanel.locator('[data-tour="json-schema-library-load"]').first().click();
  await expect(schemaInput).toHaveValue(/"title": "订单 Schema"/);

  await schemaPanel.locator('[data-tour="json-schema-validate-button"]').click();
  await expect(schemaPanel.locator('[data-tour="json-schema-status"]')).toContainText('未通过');
  await expect(schemaPanel.locator('[data-tour="json-schema-summary"]')).toContainText('当前 JSON 不符合 Schema');
  await expect(schemaPanel.locator('[data-tour="json-schema-issues"]')).toContainText('$.items[0].price');
  await expect(page.locator('[data-tour="source-editor"]')).toContainText('Schema 未通过 1 个问题');
  await expect(page.locator('[data-tour="source-editor"] .schema-issue-highlight')).toHaveCount(1);
  await expect(schemaPanel.locator('[data-tour="json-schema-copy-checklist"]')).toBeEnabled();
  await schemaPanel.locator('[data-tour="json-schema-copy-checklist"]').click();
  await expect(page.getByText('已复制 Schema 修复清单')).toBeVisible();

  await schemaPanel.locator('[data-tour="json-schema-locate-issue"]').first().click();
  const jsonPathPanel = page.getByRole('dialog', { name: 'JSONPath 查询' });
  await expect(jsonPathPanel).toBeVisible();
  await expect(jsonPathPanel.locator('[data-tour="jsonpath-input"]')).toHaveValue('$.items[0].price');
  await expect(jsonPathPanel.locator('[data-tour="jsonpath-results"]')).toContainText('0');

  const sameFieldButton = schemaPanel.locator('[data-tour="json-schema-query-same-field"]').first();
  await expect(sameFieldButton).toHaveAttribute('title', '用 $..price 查询全局同名字段');
  await sameFieldButton.click();
  await expect(page.getByText('已填入同名字段查询')).toBeVisible();
  await expect(jsonPathPanel.locator('[data-tour="jsonpath-input"]')).toHaveValue('$..price');
  await expect(jsonPathPanel.locator('[data-tour="jsonpath-results"]')).toContainText('0');

  await schemaPanel.locator('[data-tour="json-schema-copy-same-field-query"]').first().click();
  await expect(page.getByText('已复制同名字段查询')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toBe('$..price');

  await schemaInput.fill(JSON.stringify({
    type: 'array',
    minItems: 9,
    items: {
      type: 'string',
    },
  }, null, 2));
  await schemaPanel.locator('[data-tour="json-schema-apply-example"]').click();
  await expect(page.getByText('生成的示例未通过当前 Schema 校验')).toBeVisible();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"price":0');

  await schemaInput.fill(JSON.stringify(orderSchema, null, 2));
  await schemaPanel.locator('[data-tour="json-schema-apply-example"]').click();
  const applyExampleDialog = page.locator('[data-tour="confirm-dialog"]');
  await expect(applyExampleDialog).toContainText('应用 Schema 示例到源');
  await expect(applyExampleDialog).toContainText('Schema 示例:');
  await applyExampleDialog.getByRole('button', { name: '继续保留' }).click();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"price":0');

  await schemaPanel.locator('[data-tour="json-schema-apply-example"]').click();
  await page.locator('[data-tour="confirm-dialog"]').getByRole('button', { name: '应用示例' }).click();
  await expect(page.getByText('已用 Schema 示例替换 SOURCE')).toBeVisible();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"price": 1');
  await schemaPanel.locator('[data-tour="json-schema-validate-button"]').click();
  await expect(schemaPanel.locator('[data-tour="json-schema-status"]')).toContainText('通过');

  await schemaPanel.locator('[data-tour="json-schema-input"]').fill(JSON.stringify({
    type: 'object',
    required: ['id', 'items'],
    properties: {
      id: { type: 'number' },
      items: { type: 'array' },
    },
  }, null, 2));
  await schemaPanel.locator('[data-tour="json-schema-validate-button"]').click();
  await expect(schemaPanel.locator('[data-tour="json-schema-status"]')).toContainText('通过');
  await expect(schemaPanel.locator('[data-tour="json-schema-summary"]')).toContainText('当前 JSON 符合 Schema');
  await expect(page.locator('[data-tour="source-editor"] .schema-issue-highlight')).toHaveCount(0);
});

test('JSON Schema 生成会展示长数组采样摘要', async ({ page }) => {
  const items = Array.from({ length: 45 }, (_, index) => ({
    id: index + 1,
    title: `item-${index + 1}`,
    ...(index === 35 ? { cmdSchema: 'makePhoneCall', traceId: 'late-trace' } : {}),
  }));
  await fillSourceEditor(page, JSON.stringify({ items }));
  await page.locator('[data-tour="json-schema-button"]').click();

  const schemaPanel = page.getByRole('dialog', { name: 'JSON Schema 校验' });
  const schemaInput = schemaPanel.locator('[data-tour="json-schema-input"]');
  await schemaPanel.locator('[data-tour="json-schema-generate"]').click();

  const samplingSummary = schemaPanel.locator('[data-tour="json-schema-inference-summary"]');
  await expect(samplingSummary).toContainText('1 个长数组使用采样推断');
  await expect(samplingSummary).toContainText('$.items: 45 项中采样 25 项');
  await expect(samplingSummary).toContainText('命中后段稀疏字段 cmdSchema、traceId');
  await expect(samplingSummary).toContainText('required 按采样交集生成');
  const trustSummary = schemaPanel.locator('[data-tour="json-schema-trust-summary"]');
  await expect(trustSummary).toContainText('对象 2 个');
  await expect(trustSummary).toContainText('字段 5 个');
  await expect(trustSummary).toContainText('可选字段 2');
  await expect(trustSummary).toContainText('长数组采样 1');
  await expect(schemaInput).toHaveValue(/"cmdSchema"/);

  await schemaInput.fill('{"type":"object"}');
  await expect(schemaPanel.locator('[data-tour="json-schema-inference-summary"]')).toHaveCount(0);
  await expect(schemaPanel.locator('[data-tour="json-schema-trust-summary"]')).toHaveCount(0);
});

test('浮动面板支持键盘关闭并恢复入口焦点', async ({ page }) => {
  const jsonPathButton = page.locator('[data-tour="jsonpath-button"]');
  await jsonPathButton.click();

  const jsonPathPanel = page.getByRole('dialog', { name: 'JSONPath 查询' });
  await expect(jsonPathPanel).toBeVisible();
  await expect(jsonPathPanel.locator('[data-tour="jsonpath-input"]')).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(jsonPathPanel).toBeHidden();
  await expect(jsonPathButton).toBeFocused();
});

test('JSONPath 帮助入口提供可访问名称', async ({ page }) => {
  await page.locator('[data-tour="jsonpath-button"]').click();

  const jsonPathPanel = page.getByRole('dialog', { name: 'JSONPath 查询' });
  const helpButton = jsonPathPanel.getByRole('button', { name: '学习 JSONPath 语法' });

  await expect(helpButton).toBeVisible();
  await expect(helpButton).toHaveAttribute('title', '学习 JSONPath 语法');
});

test('JSONPath 查询按钮提前提示不可查询原因', async ({ page }) => {
  await page.locator('[data-tour="jsonpath-button"]').click();

  const queryButton = page.locator('[data-tour="jsonpath-query-button"]');
  const queryButtonDescription = page.locator('#jsonpath-query-button-description');
  await expect(queryButton).toHaveAttribute('title', '请先在 SOURCE 输入 JSON 数据');
  await expect(queryButton).toHaveAttribute('aria-describedby', 'jsonpath-query-button-description');
  await expect(queryButtonDescription).toHaveText('请先在 SOURCE 输入 JSON 数据');
  await expect(page.getByRole('button', { name: '查询', exact: true })).toBeVisible();

  await page.locator('[data-tour="jsonpath-input"]').fill('   ');
  await expect(queryButton).toHaveAttribute('title', '请输入 JSONPath 表达式或字段名后查询');
  await expect(queryButtonDescription).toHaveText('请输入 JSONPath 表达式或字段名后查询');
});

test('结构导航可搜索路径并联动 JSONPath 定位', async ({ page }) => {
  const jwt = [
    encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
    encodeBase64Url(JSON.stringify({ sub: 'u-1', exp: 1893456000, role: 'admin' })),
    'fake-signature',
  ].join('.');

  await fillSourceEditor(page, JSON.stringify({
    user: {
      name: 'Alice',
      'trace.id': 't-1',
      homepage: 'https://example.com/docs',
      phone: '13718164578',
      id: '13718164578',
      poster_image: 'https://static.example.com/banner.jpg',
      token: jwt,
      config_b64: encodeBase64('plain readable text longer than twenty chars'),
    },
    items: [{ id: 1, name: 'A,B' }, { id: 2, name: 'Bob' }],
    wideItems: [
      { c1: 'a1', c2: 'a2', c3: 'a3', c4: 'a4', c5: 'a5', c6: 'a6', c7: 'a7', c8: 'a8', hiddenMetric: 88 },
      { c1: 'b1', c2: 'b2', c3: 'b3', c4: 'b4', c5: 'b5', c6: 'b6', c7: 'b7', c8: 'b8', hiddenMetric: 99 },
    ],
    lateItems: [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' },
      { id: 4, name: 'D' },
      { id: 5, name: 'E' },
      { id: 6, name: 'F' },
      { id: 7, name: 'G' },
      { id: 8, name: 'H' },
      { id: 9, name: 'I', lateMetric: 88 },
      { id: 10, name: 'J', lateMetric: 99 },
    ],
  }));

  await page.locator('[data-tour="structure-nav-button"]').click();

  const structurePanel = page.getByRole('dialog', { name: 'JSON 结构导航' });
  await expect(structurePanel).toBeVisible();
  await expect(structurePanel.locator('[data-tour="structure-nav-search"]')).toBeFocused();
  await expect(structurePanel.locator('[data-tour="structure-nav-row"]').first()).toBeVisible();

  await structurePanel.locator('[data-tour="structure-nav-search"]').fill('trace.id');
  await expect(structurePanel).toContainText('trace.id');
  await expect(structurePanel.locator('[data-tour="structure-nav-row"] mark').first()).toHaveText('trace.id');

  await structurePanel.locator('[data-tour="structure-nav-copy-search-results-menu"]').click();
  await structurePanel.locator('[data-tour="structure-nav-copy-search-results"]').click();
  await expect(page.getByText('已复制搜索结果').last()).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard'))).toBe(JSON.stringify([
    {
      path: '$.user["trace.id"]',
      pointer: '/user/trace.id',
      kind: 'string',
      childCount: 0,
      preview: '"t-1"',
    },
  ], null, 2));
  const structureSearchHistory = structurePanel.locator('[data-tour="structure-nav-search-history"]');
  await expect(structureSearchHistory).toContainText('trace.id');
  await expect(structureSearchHistory.locator('[data-tour="structure-nav-search-history-item"]').filter({ hasText: 'trace.id' }))
    .toHaveAttribute('aria-label', '填入结构搜索历史：trace.id');

  await structurePanel.locator('[data-tour="structure-nav-copy-search-results-menu"]').click();
  await structurePanel.locator('[data-tour="structure-nav-copy-search-results-markdown"]').click();
  await expect(page.getByText('已复制 Markdown 摘要').last()).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard'))).toBe([
    '| Path | Pointer | Kind | Children | Preview |',
    '| --- | --- | --- | ---: | --- |',
    '| $.user["trace.id"] | /user/trace.id | string | 0 | "t-1" |',
  ].join('\n'));

  await structurePanel.locator('[data-tour="structure-nav-copy-search-results-menu"]').click();
  await structurePanel.locator('[data-tour="structure-nav-copy-search-results-csv"]').click();
  await expect(page.getByText('已复制 CSV 摘要').last()).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard'))).toBe([
    'path,pointer,kind,childCount,preview',
    '"$.user[""trace.id""]",/user/trace.id,string,0,"""t-1"""',
  ].join('\n'));

  await structurePanel.getByTitle('选中并定位 $.user["trace.id"]').click();
  await expect(structurePanel).toContainText('/user/trace.id');

  await structurePanel.getByRole('button', { name: 'Pointer' }).click();
  await expect(page.getByText('已复制 JSON Pointer')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard'))).toBe('/user/trace.id');

  await structurePanel.getByRole('button', { name: '复制值' }).click();
  await expect(page.getByText('已复制节点值')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard'))).toBe('"t-1"');

  const jsonPathPanel = page.getByRole('dialog', { name: 'JSONPath 查询' });
  await expect(jsonPathPanel).toBeVisible();
  await expect(jsonPathPanel.locator('[data-tour="jsonpath-input"]')).toHaveValue('$.user["trace.id"]');
  await expect(jsonPathPanel).toContainText('t-1');

  const sameFieldButton = structurePanel.locator('[data-tour="structure-nav-query-same-field"]');
  await expect(sameFieldButton).toHaveAttribute('title', '用 $..["trace.id"] 查询全局同名字段');
  await expect(sameFieldButton).toHaveAttribute('aria-label', '查询同名字段：trace.id');
  await sameFieldButton.click();
  await expect(page.getByText('已填入同名字段查询')).toBeVisible();
  await expect(jsonPathPanel.locator('[data-tour="jsonpath-input"]')).toHaveValue('$..["trace.id"]');
  await expect(jsonPathPanel).toContainText('t-1');

  await structurePanel.locator('[data-tour="structure-nav-search"]').fill('homepage');
  await structurePanel.getByTitle('选中并定位 $.user.homepage').click();
  await expect(structurePanel.locator('[data-tour="structure-nav-semantic-hints"]')).toContainText('URL');
  await expect(structurePanel.locator('[data-tour="structure-nav-semantic-hints"]')).toContainText('example.com/docs');
  await expect(structureSearchHistory).toContainText('homepage');
  await structureSearchHistory.locator('[data-tour="structure-nav-search-history-item"]').filter({ hasText: 'trace.id' }).click();
  await expect(structurePanel.locator('[data-tour="structure-nav-search"]')).toHaveValue('trace.id');
  await expect(structurePanel.locator('[data-tour="structure-nav-row"]')).toHaveCount(1);
  await page.getByRole('button', { name: '删除结构搜索历史：homepage' }).click();
  await expect(structureSearchHistory).not.toContainText('homepage');

  await structurePanel.locator('[data-tour="structure-nav-search"]').fill('phone');
  await structurePanel.getByTitle('选中并定位 $.user.phone').click();
  await expect(structurePanel.locator('[data-tour="structure-nav-semantic-hints"]')).toContainText('电话');
  await expect(structurePanel.locator('[data-tour="structure-nav-semantic-hints"]')).toContainText('137****4578');

  await structurePanel.locator('[data-tour="structure-nav-search"]').fill('id');
  await structurePanel.getByTitle('选中并定位 $.user.id').click();
  await expect(structurePanel.locator('[data-tour="structure-nav-semantic-hints"]')).toHaveCount(0);

  await structurePanel.locator('[data-tour="structure-nav-search"]').fill('poster_image');
  await structurePanel.getByTitle('选中并定位 $.user.poster_image').click();
  await expect(structurePanel.locator('[data-tour="structure-nav-semantic-hints"]')).toContainText('图片资源');
  await expect(structurePanel.locator('[data-tour="structure-nav-semantic-hints"]')).toContainText('banner.jpg');

  await structurePanel.locator('[data-tour="structure-nav-search"]').fill('token');
  await structurePanel.getByTitle('选中并定位 $.user.token').click();
  await expect(structurePanel.locator('[data-tour="structure-nav-semantic-hints"]')).toContainText('JWT');
  await expect(structurePanel.locator('[data-tour="structure-nav-semantic-hints"]')).toContainText('payload: sub, exp, role');

  await structurePanel.locator('[data-tour="structure-nav-search"]').fill('config_b64');
  await structurePanel.getByTitle('选中并定位 $.user.config_b64').click();
  await expect(structurePanel.locator('[data-tour="structure-nav-semantic-hints"]')).toContainText('Base64');
  await expect(structurePanel.locator('[data-tour="structure-nav-semantic-hints"]')).toContainText('文本 44 字符');

  await structurePanel.locator('[data-tour="structure-nav-search"]').fill('items');
  await structurePanel.locator('button[title="选中并定位 $.items"]').click();

  await structurePanel.locator('[data-tour="structure-nav-copy-subtree"]').click();
  await expect(page.getByText('已复制节点子树')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard'))).toBe(JSON.stringify([
    { id: 1, name: 'A,B' },
    { id: 2, name: 'Bob' },
  ], null, 2));

  await structurePanel.locator('[data-tour="structure-nav-copy-typescript"]').click();
  await expect(page.getByText('已复制 TS 类型')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard'))).toContain([
    'export type Items = ItemsItem[];',
    '',
    'export interface ItemsItem {',
    '  id: number;',
    '  name: string;',
    '}',
  ].join('\n'));

  await structurePanel.locator('button[title="选中并定位 $.items[0]"]').click();
  await expect(structurePanel.locator('[data-tour="structure-nav-query-same-field"]')).toHaveCount(0);
  await structurePanel.locator('[data-tour="structure-nav-copy-typescript"]').click();
  await expect(page.getByText('已复制 TS 类型').last()).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard'))).toContain([
    'export interface ItemsItem {',
    '  id: number;',
    '  name: string;',
    '}',
  ].join('\n'));

  await structurePanel.locator('button[title="选中并定位 $.items"]').click();

  const tablePreview = structurePanel.locator('[data-tour="structure-nav-table-preview"]');
  await expect(tablePreview).toBeVisible();
  await expect(tablePreview).toContainText('对象数组预览: 2/2 行，2/2 列');
  await expect(tablePreview).toContainText('A,B');

  await tablePreview.locator('[data-tour="structure-nav-copy-table-csv"]').dispatchEvent('click');
  await expect(page.getByText('已复制表格 CSV')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard'))).toBe('id,name\n1,"A,B"\n2,Bob');

  await tablePreview.locator('[data-tour="structure-nav-copy-table-json"]').dispatchEvent('click');
  await expect(page.getByText('已复制表格 JSON')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard'))).toBe(JSON.stringify([
    { id: 1, name: 'A,B' },
    { id: 2, name: 'Bob' },
  ], null, 2));

  await tablePreview.locator('[data-tour="structure-nav-table-column-filter"]').fill('missing');
  await expect(tablePreview).toContainText('没有匹配的表格列');
  await expect(tablePreview.locator('[data-tour="structure-nav-copy-table-csv"]')).toBeDisabled();
  await expect(tablePreview.locator('[data-tour="structure-nav-copy-table-json"]')).toBeDisabled();

  await tablePreview.locator('[data-tour="structure-nav-table-column-filter"]').fill('name');
  await expect(tablePreview).toContainText('列筛选 1/2');
  await tablePreview.locator('[data-tour="structure-nav-copy-table-csv"]').dispatchEvent('click');
  await expect(page.getByText('已复制表格 CSV').last()).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard'))).toBe('name\n"A,B"\nBob');

  await tablePreview.locator('[data-tour="structure-nav-copy-table-json"]').click();
  await expect(page.getByText('已复制表格 JSON').last()).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard'))).toBe(JSON.stringify([
    { name: 'A,B' },
    { name: 'Bob' },
  ], null, 2));

  await structurePanel.locator('[data-tour="structure-nav-search"]').fill('wideItems');
  await structurePanel.locator('button[title="选中并定位 $.wideItems"]').click();
  await tablePreview.locator('[data-tour="structure-nav-table-column-filter"]').fill('hiddenMetric');
  await expect(tablePreview).toContainText('列筛选 1/9');
  await expect(tablePreview).toContainText('hiddenMetric');
  await tablePreview.locator('[data-tour="structure-nav-copy-table-csv"]').click();
  await expect(page.getByText('已复制表格 CSV').last()).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard'))).toBe('hiddenMetric\n88\n99');

  await structurePanel.locator('[data-tour="structure-nav-search"]').fill('lateItems');
  await structurePanel.locator('button[title="选中并定位 $.lateItems"]').click();
  await expect(tablePreview).toContainText('对象数组预览: 8/10 行，2/3 列');
  await tablePreview.locator('[data-tour="structure-nav-table-column-filter"]').fill('lateMetric');
  await expect(tablePreview).toContainText('列筛选 1/3');
  await expect(tablePreview).toContainText('行重采样');
  await expect(tablePreview).toContainText('lateMetric');
  await tablePreview.locator('[data-tour="structure-nav-copy-table-csv"]').click();
  await expect(page.getByText('已复制表格 CSV').last()).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard'))).toBe('lateMetric\n88\n99');

  await structurePanel.locator('[data-tour="structure-nav-search"]').fill('');
  await structurePanel.locator('[data-tour="structure-nav-kind-filter"]').selectOption('array');
  await expect(structurePanel.locator('[data-tour="structure-nav-row"]')).toHaveCount(3);
  await expect(structurePanel.locator('[data-tour="structure-nav-row"]').first()).toContainText('items');

  await structurePanel.locator('[data-tour="structure-nav-copy-search-results-menu"]').click();
  await structurePanel.locator('[data-tour="structure-nav-copy-search-results"]').click();
  await expect(page.getByText('已复制搜索结果').last()).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard'))).toBe(JSON.stringify([
    {
      path: '$.items',
      pointer: '/items',
      kind: 'array',
      childCount: 2,
      preview: '数组 2 项',
    },
    {
      path: '$.wideItems',
      pointer: '/wideItems',
      kind: 'array',
      childCount: 2,
      preview: '数组 2 项',
    },
    {
      path: '$.lateItems',
      pointer: '/lateItems',
      kind: 'array',
      childCount: 10,
      preview: '数组 10 项',
    },
  ], null, 2));

  await structurePanel.locator('[data-tour="structure-nav-copy-search-results-menu"]').click();
  await structurePanel.locator('[data-tour="structure-nav-copy-search-results-csv"]').click();
  await expect(page.getByText('已复制 CSV 摘要').last()).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard'))).toBe([
    'path,pointer,kind,childCount,preview',
    '$.items,/items,array,2,数组 2 项',
    '$.wideItems,/wideItems,array,2,数组 2 项',
    '$.lateItems,/lateItems,array,10,数组 10 项',
  ].join('\n'));

  await page.getByRole('button', { name: '清空结构搜索历史' }).click();
  await expect(structurePanel.locator('[data-tour="structure-nav-search-history"]')).toHaveCount(0);
});

test('结构导航语义字符串可继续打开 Scheme 解析', async ({ page }) => {
  await page.evaluate(() => {
    window.localStorage.setItem('json-helper-general-settings', JSON.stringify({
      autoExpandSchemeInDeepFormat: false,
    }));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForMainAppReady(page);

  const businessScheme = 'sampleapp://v7/vendor/ad/makePhoneCall?params=%7B%22phone%22%3A%2213718164578%22%7D';

  await fillSourceEditor(page, JSON.stringify({
    user: {
      phone: '13718164578',
      action_cmd: businessScheme,
    },
  }));

  await page.locator('[data-tour="structure-nav-button"]').click();

  const structurePanel = page.getByRole('dialog', { name: 'JSON 结构导航' });
  await expect(structurePanel).toBeVisible();

  await structurePanel.locator('[data-tour="structure-nav-search"]').fill('phone');
  await structurePanel.getByTitle('选中并定位 $.user.phone').click();
  await expect(structurePanel.locator('[data-tour="structure-nav-semantic-hints"]')).toContainText('电话');
  await expect(structurePanel.locator('[data-tour="structure-nav-open-semantic-value"]')).toHaveCount(0);

  await structurePanel.locator('[data-tour="structure-nav-search"]').fill('action_cmd');
  await structurePanel.getByTitle('选中并定位 $.user.action_cmd').click();
  await expect(structurePanel.locator('[data-tour="structure-nav-semantic-hints"]')).toContainText('Scheme');

  await structurePanel.locator('[data-tour="structure-nav-open-semantic-value"]').click();
  await expect(page.getByText('已填入 Scheme 解析')).toBeVisible();

  const schemePanel = page.getByRole('dialog', { name: 'Scheme 解析' });
  await expect(schemePanel).toBeVisible();
  await expect(schemePanel.locator('[data-tour="scheme-standalone-input"]')).toHaveValue(businessScheme);
});

test('编辑器自动换行开关展示可访问状态', async ({ page }) => {
  await waitForEditorReady(page, '[data-tour="source-editor"]');
  const wrapToggle = page.locator('[data-tour="source-editor"] [data-tour="editor-wrap"]');

  await expect(wrapToggle).toHaveAttribute('aria-pressed', 'false');
  await expect(wrapToggle).toHaveAttribute('title', '自动换行已关闭，点击开启');
  await expect(wrapToggle).toContainText('不换行');

  await wrapToggle.click();
  await expect(wrapToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(wrapToggle).toHaveAttribute('title', '自动换行已开启，点击关闭');
  await expect(wrapToggle).toContainText('换行');

  await wrapToggle.click();
  await expect(wrapToggle).toHaveAttribute('aria-pressed', 'false');
  await expect(wrapToggle).toContainText('不换行');
});

test('预览编辑锁定开关展示中文状态', async ({ page }) => {
  await waitForEditorReady(page, '[data-tour="preview-editor"]');
  const lockToggle = page.locator('[data-tour="preview-editor"] [data-tour="editor-lock"]');

  await expect(lockToggle).toHaveAttribute('aria-pressed', 'false');
  await expect(lockToggle).toHaveAttribute('title', 'PREVIEW 已锁定，点击解锁编辑');
  await expect(page.getByRole('button', { name: 'PREVIEW 已锁定，点击解锁编辑' })).toBeVisible();

  await lockToggle.click();
  await expect(lockToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(lockToggle).toHaveAttribute('title', 'PREVIEW 可编辑，点击重新锁定');
  await expect(page.getByRole('button', { name: 'PREVIEW 可编辑，点击重新锁定' })).toBeVisible();
});

test('布局分隔条支持键盘调整', async ({ page }) => {
  const sidebarResizeHandle = page.locator('[data-tour="sidebar-resize-handle"]');
  await expect(sidebarResizeHandle).toHaveAttribute('role', 'separator');
  await expect(sidebarResizeHandle).toHaveAttribute('aria-label', '调整工具栏宽度');
  await expect(sidebarResizeHandle).toHaveAttribute('aria-valuenow', '220');

  await sidebarResizeHandle.focus();
  await page.keyboard.press('ArrowRight');
  await expect(sidebarResizeHandle).toHaveAttribute('aria-valuenow', '236');
  await page.keyboard.press('Home');
  await expect(sidebarResizeHandle).toHaveAttribute('aria-valuenow', '180');
  await page.keyboard.press('End');
  await expect(sidebarResizeHandle).toHaveAttribute('aria-valuenow', '400');

  const paneResizeHandle = page.locator('[data-tour="editor-pane-resize-handle"]');
  await expect(paneResizeHandle).toHaveAttribute('role', 'separator');
  await expect(paneResizeHandle).toHaveAttribute('aria-label', '调整 SOURCE 和 PREVIEW 宽度');
  await expect(paneResizeHandle).toHaveAttribute('aria-valuenow', '50');

  await paneResizeHandle.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(paneResizeHandle).toHaveAttribute('aria-valuenow', '45');
  await page.keyboard.press('Home');
  await expect(paneResizeHandle).toHaveAttribute('aria-valuenow', '20');
  await page.keyboard.press('End');
  await expect(paneResizeHandle).toHaveAttribute('aria-valuenow', '80');
});

test('JSON Lines 可格式化为可读数组预览', async ({ page }) => {
  await fillSourceEditor(page, '{"id":1}\n{"id":2}');

  await page.getByRole('button', { name: '格式化' }).click();
  await expectPreviewText(page, '"id": 1');
  await expectPreviewText(page, '"id": 2');
});

test('状态栏展示当前焦点内容的 UTF-8 字节体积', async ({ page }) => {
  await fillSourceEditor(page, '{"text":"中文"}');
  await expect(page.locator('[data-tour="statusbar"]')).toContainText('Length: 13');
  await expect(page.locator('[data-tour="statusbar-byte-size"]')).toContainText('Size: 17 B');

  await page.getByRole('button', { name: '格式化' }).click();
  await waitForEditorReady(page, '[data-tour="preview-editor"]');
  await page.locator('[data-tour="preview-editor"] .monaco-editor').click();
  await expect(page.locator('[data-tour="statusbar"]')).toContainText('Length: 18');
  await expect(page.locator('[data-tour="statusbar-byte-size"]')).toContainText('Size: 22 B');
});

test('状态栏版本号在窄屏仍保持可见', async ({ page }) => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf-8')) as {
    version: string;
  };

  await page.setViewportSize({ width: 640, height: 700 });
  await fillSourceEditor(page, '{"text":"中文","items":[1,2,3]}');

  const statusBar = page.locator('[data-tour="statusbar"]');
  const versionBadge = page.locator('[data-tour="statusbar-version"]');

  await expect(versionBadge).toHaveText(`v${packageJson.version}`);
  await expect(versionBadge).toHaveAttribute('title', '当前版本，点击查看更新日志');
  await expectElementInside(versionBadge, statusBar);
});

test('状态栏版本号可打开版本更新日志', async ({ page }) => {
  const versionBadge = page.locator('[data-tour="statusbar-version"]');

  await versionBadge.click();

  const changelogDialog = page.getByRole('dialog', { name: '版本更新' });
  await expect(changelogDialog).toBeVisible();
  await expect(changelogDialog).toHaveJSProperty('open', true);
  await expect(changelogDialog).toContainText('当前版本');
  await expect(changelogDialog).toContainText('版本更新');

  const closeButton = changelogDialog.getByRole('button', { name: '关闭版本更新' });
  const confirmButton = changelogDialog.getByRole('button', { name: '知道了' });
  await expect(closeButton).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(confirmButton).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(closeButton).toBeFocused();

  await closeButton.click();
  await expect(changelogDialog).toBeHidden();
  await expect(versionBadge).toBeFocused();

  await versionBadge.click();
  await expect(changelogDialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(changelogDialog).toBeHidden();
  await expect(versionBadge).toBeFocused();

  await versionBadge.click();
  await changelogDialog.getByRole('heading', { name: '版本更新' }).click();
  await expect(changelogDialog).toBeVisible();
  await page.mouse.click(1, 1);
  await expect(changelogDialog).toBeHidden();
  await expect(versionBadge).toBeFocused();
});

test('检测到线上新版本时提示刷新', async ({ page }) => {
  await page.route('**/version.json*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name: 'JSONUtils',
        version: '99.0.0',
        versionLabel: 'v99.0.0',
        changelogMarkdown: [
          '## v99.0.0 (2026-06-19) - 远端测试版本',
          '### ✨ 新特性',
          '- **更新提示**: 支持在刷新前查看远端版本日志',
        ].join('\n'),
      }),
    });
  });

  await page.evaluate(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });

  const updateToast = page.locator('[data-tour="app-update-toast"]');
  await expect(updateToast).toContainText('发现新版本 v99.0.0');
  await expect(updateToast.getByRole('button', { name: '查看更新' })).toBeVisible();
  await expect(updateToast.getByRole('button', { name: '刷新' })).toBeVisible();
  await expect(updateToast.getByRole('button', { name: '稍后' })).toBeVisible();

  await updateToast.getByRole('button', { name: '查看更新' }).click();
  const changelogDialog = page.getByRole('dialog', { name: '版本更新' });
  await expect(changelogDialog).toContainText('v99.0.0');
  await expect(changelogDialog).toContainText('远端测试版本');
  await expect(changelogDialog).toContainText('支持在刷新前查看远端版本日志');
});

test('状态栏展示 SOURCE JSON 校验状态', async ({ page }) => {
  const validationStatus = page.locator('[data-tour="source-validation-status"]');

  await expect(validationStatus).toHaveText('SOURCE 空');

  await fillSourceEditor(page, 'plain text');
  await expect(validationStatus).toHaveText('SOURCE 文本');
  await expect(validationStatus).toHaveAttribute('title', '当前 SOURCE 不以 { 或 [ 开头，按普通文本处理');

  await fillSourceEditor(page, '{"ok":true}');
  await expect(validationStatus).toHaveText('JSON 有效');
  await expect(validationStatus).toHaveAttribute('title', 'SOURCE JSON / JSON Lines 校验通过');

  await fillSourceEditor(page, '{"ok":true}\n{"broken":}');
  await expect(validationStatus).toContainText('JSON 无效');
  await expect(validationStatus).toHaveAttribute('title', /SOURCE JSON 无效:/);
  await validationStatus.click();
  await expect(page.locator('[data-tour="statusbar"]')).toContainText('Ln 2');
});

test('JSON Lines 可深度格式化行内嵌套 JSON', async ({ page }) => {
  await fillSourceEditor(page, '{"payload":"{\\"nested\\":true}"}\n{"payload":"{\\"nested\\":false}"}');

  await page.locator('[data-tour="deep-format-btn"]').click();
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

  await page
    .locator('[data-tour="transform-report-row"]')
    .filter({ hasText: '$[0].payload' })
    .locator('[data-tour="transform-report-copy-original-value"]')
    .click();
  await expect(page.getByText('已复制原始值')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toBe('{"nested":true}');

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
  await expect(jsonPathPanel).toBeVisible({ timeout: 30_000 });
  await expect(jsonPathPanel.locator('[data-tour="jsonpath-input"]')).toHaveValue('$[0].payload.nested');
  await expect(jsonPathPanel.locator('[data-tour="jsonpath-results"]')).toContainText('true');
});

test('Scheme 行内提示在预览编辑器中可见', async ({ page }) => {
  await fillSourceEditor(page, JSON.stringify({
    scheme: 'sampleapp://v1/browser/open?url=https%3A%2F%2Fexample.com',
  }));

  await waitForEditorReady(page, '[data-tour="preview-editor"]');
  const previewEditor = page.locator('[data-tour="preview-editor"]');
  const schemeHighlight = previewEditor.locator('.scheme-inline-highlight').first();
  await expect(schemeHighlight).toBeVisible({ timeout: 15_000 });
  await expect(previewEditor.locator('[data-tour="editor-scheme-count"]')).toHaveText('Scheme 1', { timeout: 15_000 });

  await schemeHighlight.hover();

  const schemeHover = page
    .locator('.monaco-hover, .monaco-editor-hover')
    .filter({ hasText: '点击解析 Scheme' })
    .last();
  await expect(schemeHover).toBeVisible();
  await expect(schemeHover).toContainText('点击解析 Scheme');
});

test('SOURCE 直接粘贴 Scheme 时即使关闭递归展开也会结构化预览', async ({ page }) => {
  await page.evaluate(() => {
    window.localStorage.setItem('json-helper-general-settings', JSON.stringify({
      autoExpandSchemeInDeepFormat: false,
    }));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForMainAppReady(page);

  const scheme = `sampleapp://v7/vendor/ad/makePhoneCall?params=${encodeURIComponent(JSON.stringify({
    phone: '400-805-8686',
    extInfo: encodeBase64(JSON.stringify({ segment: 222, rank: 2 })),
  }))}`;

  await fillSourceEditor(page, scheme);

  await expect(page.locator('[data-tour="source-validation-status"]')).toHaveText('SOURCE Scheme');
  await expect(page.locator('[data-tour="statusbar-view"]')).toContainText('深度格式化');
  await expectPreviewText(page, '"params": {');
  await expectPreviewText(page, '"phone": "400-805-8686"');
  await expectPreviewText(page, '"extInfo": {');
  await expectPreviewText(page, '"segment": 222');
  await expect(page.locator('[data-tour="preview-editor"] .view-lines')).toContainText(
    '"__scheme__": "sampleapp://v7/vendor/ad/makePhoneCall"'
  );

  await page.locator('[data-tour="source-validation-status"]').click();
  const schemePanel = page.locator('[data-tour="scheme-panel"]');
  await expect(schemePanel).toContainText('Scheme 解析');
  await expect(schemePanel.locator('[data-tour="scheme-standalone-input"]')).toHaveValue(scheme);
  await expandSchemeDetails(page);
  await expect(schemePanel.locator('[data-tour="scheme-decode-layers"]')).toContainText('解析链路');
  await expect(schemePanel.locator('[data-tour="scheme-decode-layer"]').first()).toContainText('URL 参数递归解析');
  await expect(schemePanel.locator('[data-tour="scheme-param-stages"]')).toContainText('参数分层');
  await expect(schemePanel.locator('[data-tour="scheme-param-stage"]').first()).toContainText('params');
});

test('SOURCE 直接粘贴 Unicode 转义 Scheme 时自动结构化预览', async ({ page }) => {
  await page.evaluate(() => {
    window.localStorage.setItem('json-helper-general-settings', JSON.stringify({
      autoExpandSchemeInDeepFormat: false,
    }));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForMainAppReady(page);

  const scheme = 'sampleapp\\u003a\\u002f\\u002fv1\\u002fbrowser\\u002fopen\\u003furl\\u003dhttps%253A%252F%252Fm.example.com%252Fs%253Fword%253Djson';

  await fillSourceEditor(page, scheme);

  await expect(page.locator('[data-tour="source-validation-status"]')).toHaveText('SOURCE Scheme');
  await expect(page.locator('[data-tour="statusbar-view"]')).toContainText('深度格式化');
  await expectPreviewText(page, '"url": {');
  await expectPreviewText(page, '"word": "json"');
  await expect(page.locator('[data-tour="preview-editor"] .view-lines')).not.toContainText('u003a');

  await page.locator('[data-tour="source-validation-status"]').click();
  const schemePanel = page.locator('[data-tour="scheme-panel"]');
  await expect(schemePanel).toContainText('Scheme 解析');
  await expect(schemePanel.locator('[data-tour="scheme-standalone-input"]')).toHaveValue(scheme);
});

test('SOURCE 直接粘贴 URL 编码 JSON 时自动结构化预览', async ({ page }) => {
  await page.evaluate(() => {
    window.localStorage.setItem('json-helper-general-settings', JSON.stringify({
      autoExpandSchemeInDeepFormat: false,
    }));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForMainAppReady(page);

  const encodedJson = encodeURIComponent(JSON.stringify({
    code: 0,
    data: {
      title: '编码 JSON',
      items: [1, 2, 3],
    },
  }));

  await fillSourceEditor(page, encodedJson);

  await expect(page.locator('[data-tour="source-validation-status"]')).toHaveText('SOURCE 编码JSON');
  await expect(page.locator('[data-tour="statusbar-view"]')).toContainText('深度格式化');
  await expectPreviewText(page, '"data": {');
  await expectPreviewText(page, '"title": "编码 JSON"');
  await expectPreviewText(page, '"items": [');
  await expect(page.locator('[data-tour="preview-editor"] .view-lines')).not.toContainText('%7B');

  await page.locator('[data-tour="source-validation-status"]').click();
  const schemePanel = page.locator('[data-tour="scheme-panel"]');
  await expect(schemePanel).toContainText('Scheme 解析');
  await expect(schemePanel.locator('[data-tour="scheme-standalone-input"]')).toHaveValue(encodedJson);
});

test('SOURCE 直接粘贴 URL 编码 CMD 时自动结构化预览', async ({ page }) => {
  await page.evaluate(() => {
    window.localStorage.setItem('json-helper-general-settings', JSON.stringify({
      autoExpandSchemeInDeepFormat: false,
    }));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForMainAppReady(page);

  const decodedCmd = `cmd=${encodeURIComponent(JSON.stringify({ nid: 123, title: '标题' }))}&from=feed`;
  const encodedCmd = encodeURIComponent(decodedCmd);

  await fillSourceEditor(page, encodedCmd);

  await expect(page.locator('[data-tour="source-validation-status"]')).toHaveText('SOURCE 编码Scheme');
  await expect(page.locator('[data-tour="statusbar-view"]')).toContainText('深度格式化');
  await expectPreviewText(page, '"cmd": {');
  await expectPreviewText(page, '"nid": 123');
  await expectPreviewText(page, '"from": "feed"');
  await expect(page.locator('[data-tour="preview-editor"] .view-lines')).not.toContainText('cmd%3D');

  await page.locator('[data-tour="source-validation-status"]').click();
  const schemePanel = page.locator('[data-tour="scheme-panel"]');
  await expect(schemePanel).toContainText('Scheme 解析');
  await expect(schemePanel.locator('[data-tour="scheme-standalone-input"]')).toHaveValue(encodedCmd);
});

test('深度解析报告筛选会展示隐藏内部路径', async ({ page }) => {
  const widePayload = {
    ...Object.fromEntries(Array.from({ length: 20 }, (_, index) => [`k${index}`, index])),
    target_after_display_limit: 'needle_after_display_limit',
  };
  await fillSourceEditor(page, JSON.stringify({
    payload: JSON.stringify(widePayload),
  }));

  await page.locator('[data-tour="deep-format-btn"]').click();
  await page.locator('[data-tour="transform-report-button"]').click();

  const reportPanel = page.locator('[data-tour="transform-report-panel"]');
  await expect(reportPanel.locator('[data-tour="transform-report-more-decoded-paths"]')).toContainText('已索引 21 条');
  await expect(reportPanel.locator('[data-tour="transform-report-more-decoded-paths"]')).toContainText('搜索字段名展示隐藏路径');

  await page.locator('[data-tour="transform-report-copy-path-values"]').click();
  await expect(page.getByText('已复制路径和值（21 项）').last()).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toContain('$.payload.target_after_display_limit = "needle_after_display_limit"');

  await page.locator('[data-tour="transform-report-filter"]').fill('target_after_display_limit');
  const hiddenDecodedPath = reportPanel
    .locator('[data-tour="transform-report-decoded-path"]')
    .filter({ hasText: '$.payload.target_after_display_limit' });

  await expect(hiddenDecodedPath).toContainText('needle_after_display_limit');
  await hiddenDecodedPath.locator('[data-tour="transform-report-copy-decoded-value"]').click();
  await expect(page.getByText('已复制路径和值').last()).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toBe('$.payload.target_after_display_limit = "needle_after_display_limit"');

  await page.locator('[data-tour="transform-report-copy-path-values"]').click();
  await expect(page.getByText('已复制路径和值（1 项）').last()).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toBe('$.payload.target_after_display_limit = "needle_after_display_limit"');

  await page.locator('[data-tour="transform-report-filter"]').fill('not_exist_in_report');
  await expect(reportPanel.locator('[data-tour="transform-report-empty"]')).toContainText('没有匹配的解析记录');
  const copyPathValuesButton = reportPanel.locator('[data-tour="transform-report-copy-path-values"]');
  await expect(copyPathValuesButton).toBeDisabled();
  await expect(copyPathValuesButton).toHaveAttribute('title', '当前筛选没有可复制的路径和值');
  await expect(copyPathValuesButton).toHaveAttribute('aria-label', '复制路径值，当前筛选没有可复制的路径和值');
  const copyIssueSamplesButton = reportPanel.locator('[data-tour="transform-report-copy-issue-samples"]');
  await expect(copyIssueSamplesButton).toBeDisabled();
  await expect(copyIssueSamplesButton).toHaveAttribute('title', '当前筛选没有待检查、跳过或占位符来源样本可复制');
  await expect(copyIssueSamplesButton).toHaveAttribute('aria-label', '复制问题样本，当前筛选没有待检查、跳过或占位符来源样本可复制');
  await reportPanel.locator('[data-tour="transform-report-empty-clear"]').click();
  await expect(page.locator('[data-tour="transform-report-filter"]')).toHaveValue('');
  await expect(reportPanel.locator('[data-tour="transform-report-records"]')).toContainText('$.payload');
});

test('深度解析报告切换输入后清空旧筛选', async ({ page }) => {
  await fillSourceEditor(page, JSON.stringify({
    old_payload: JSON.stringify({
      old_target: true,
    }),
  }));

  await page.locator('[data-tour="deep-format-btn"]').click();
  await page.locator('[data-tour="transform-report-button"]').click();

  const reportPanel = page.locator('[data-tour="transform-report-panel"]');
  const filterInput = page.locator('[data-tour="transform-report-filter"]');
  await filterInput.fill('old_target');
  await expect(reportPanel.locator('[data-tour="transform-report-records"]')).toContainText('$.old_payload');
  await reportPanel.getByRole('button', { name: '关闭 深度解析报告' }).click();
  await expect(reportPanel).toBeHidden();

  await fillSourceEditor(page, JSON.stringify({
    new_payload: JSON.stringify({
      new_target: true,
    }),
  }));

  await expectPreviewText(page, '"new_target": true');
  await page.locator('[data-tour="transform-report-button"]').click();
  await expect(filterInput).toHaveValue('');
  await expect(reportPanel.locator('[data-tour="transform-report-records"]')).toContainText('$.new_payload');
  await expect(reportPanel.locator('[data-tour="transform-report-records"]')).not.toContainText('$.old_payload');
  await expect(reportPanel.locator('[data-tour="transform-report-empty"]')).toBeHidden();
});

test('深度解析报告展示未展开线索', async ({ page }) => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf-8')) as {
    version: string;
  };
  const expectedToolMetadata = {
    name: 'JSONUtils',
    version: packageJson.version,
    versionLabel: `v${packageJson.version}`,
  };

  await fillSourceEditor(page, '{"tracking":"raw=%7B%22nid%22%3A123%7D"}');

  await page.locator('[data-tour="deep-format-btn"]').click();
  await expect(page.locator('[data-tour="preview-editor"]')).toContainText('待检查 1');
  await expectPreviewText(page, '"tracking": "raw={\\"nid\\":123}"');

  await page.locator('[data-tour="transform-report-button"]').click();
  const reportPanel = page.locator('[data-tour="transform-report-panel"]');
  const coverage = reportPanel.locator('[data-tour="transform-report-coverage"]');
  const nextActions = reportPanel.locator('[data-tour="transform-report-next-actions"]');
  const triage = reportPanel.locator('[data-tour="transform-report-issue-triage"]');
  const unresolvedSection = reportPanel.locator('[data-tour="transform-report-unresolved"]');

  await expect(coverage).toContainText('解析覆盖 50%');
  await expect(coverage).toContainText('还有 1 条疑似结构化内容未完全展开');
  await expect(nextActions).toContainText('真实 response 下一步');
  await expect(nextActions).toContainText('查看待处理');
  await expect(nextActions).toContainText('复制归档包');
  await expect(nextActions).toContainText('复制协作报告');
  await nextActions.locator('[data-tour="transform-report-next-action-triage"]').click();
  await expect(reportPanel.locator('[data-tour="transform-report-filter"]')).toHaveValue('待处理');
  await expect(unresolvedSection).toContainText('$.tracking');
  await reportPanel.getByRole('button', { name: '清空' }).click();
  await expect(triage).toContainText('建议优先处理');
  await expect(triage).toContainText('待检查 1');
  await triage.locator('[data-tour="transform-report-triage-action-unresolved"]').click();
  await expect(reportPanel.locator('[data-tour="transform-report-filter"]')).toHaveValue('待检查');
  await expect(unresolvedSection).toContainText('$.tracking');
  await reportPanel.getByRole('button', { name: '清空' }).click();
  await reportPanel.locator('[data-tour="transform-report-issue-priority"]').click();
  await expect(reportPanel.locator('[data-tour="transform-report-filter"]')).toHaveValue('待处理');
  await expect(unresolvedSection).toContainText('$.tracking');
  await reportPanel.getByRole('button', { name: '清空' }).click();
  await reportPanel.locator('[data-tour="transform-report-unresolved-count"]').click();
  await expect(reportPanel.locator('[data-tour="transform-report-filter"]')).toHaveValue('待检查');
  await expect(unresolvedSection).toContainText('$.tracking');
  await reportPanel.getByRole('button', { name: '清空' }).click();
  await expect(unresolvedSection).toContainText('未展开线索 · 1');
  await expect(unresolvedSection).toContainText('$.tracking');
  await expect(unresolvedSection).toContainText('url-encoded');
  await expect(unresolvedSection).toContainText('已解码但未结构化');
  await expect(unresolvedSection).toContainText('下一步: 定位该字段确认是否只是普通埋点参数');
  await expect(unresolvedSection).toContainText('URL 编码内容已解码，但未展开为结构化对象');
  await unresolvedSection.getByRole('button', { name: '复制路径' }).click();
  await expect(page.getByText('已复制路径')).toBeVisible();
  await unresolvedSection.locator('[data-tour="transform-report-copy-unresolved-value"]').click();
  await expect(page.getByText('已复制原始值')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toBe('raw=%7B%22nid%22%3A123%7D');

  await reportPanel.locator('[data-tour="transform-report-copy-issue-samples"]').click();
  await expect(page.getByText('已复制问题样本')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toContain('未展开线索');
  const issueSamples = await page.evaluate(() => window.localStorage.getItem('mock-clipboard') || '');
  expect(issueSamples).toContain('$.tracking');
  expect(issueSamples).toContain('已解码但未结构化');
  expect(issueSamples).toContain('raw=%7B%22nid%22%3A123%7D');

  await reportPanel.locator('[data-tour="transform-report-copy-issue-sample-json"]').click();
  await expect(page.getByText('已复制样本 JSON')).toBeVisible();
  const issueSampleJson = JSON.parse(await page.evaluate(() => window.localStorage.getItem('mock-clipboard') || '{}'));
  expect(issueSampleJson.kind).toBe('json-helper-transform-issue-samples');
  expect(issueSampleJson.tool).toEqual(expectedToolMetadata);
  expect(issueSampleJson.summary.unresolved.copied).toBe(1);
  expect(issueSampleJson.samples[0]).toMatchObject({
    type: 'unresolved',
    path: '$.tracking',
    detectedType: 'url-encoded',
    originalValue: 'raw=%7B%22nid%22%3A123%7D',
  });

  await reportPanel.locator('[data-tour="transform-report-copy-diagnostic-summary"]').click();
  await expect(reportPanel.locator('[data-tour="transform-report-copy-diagnostic-summary"]')).toHaveAttribute('aria-label', '复制诊断摘要，复制不含原始大字段值的解析覆盖、CMD Schema 和风险摘要');
  await expect(page.getByText(/已复制诊断摘要（\d+ 字符 \/ [\d.]+ (?:B|KB|MB)）/)).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toContain('深度解析诊断摘要');
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toContain(`工具版本: v${packageJson.version}`);

  await expect(reportPanel.locator('[data-tour="transform-report-copy-quality-snapshot"]')).toHaveAttribute('aria-label', '复制质量快照，复制不含原始大字段值的解析质量指标 JSON，便于保存基线或对比趋势');
  await reportPanel.locator('[data-tour="transform-report-copy-quality-snapshot"]').click();
  await expect(page.getByText(/已复制质量快照（\d+ 字符 \/ [\d.]+ (?:B|KB|MB)）/)).toBeVisible();
  const qualitySnapshot = JSON.parse(await page.evaluate(() => window.localStorage.getItem('mock-clipboard') || '{}'));
  expect(qualitySnapshot.kind).toBe('json-helper-transform-quality-snapshot');
  expect(qualitySnapshot.tool).toEqual(expectedToolMetadata);
  expect(qualitySnapshot.coverage.score).toBe(50);
  expect(qualitySnapshot.filtered.unresolved).toBe(1);
  expect(qualitySnapshot.hotspots.unresolvedReasons[0]).toMatchObject({
    key: '已解码但未结构化',
    count: 1,
    paths: ['$.tracking'],
  });
  expect(JSON.stringify(qualitySnapshot)).not.toContain('raw=%7B%22nid%22%3A123%7D');

  await reportPanel.locator('[data-tour="transform-report-set-quality-baseline"]').click();
  await expect(page.getByText('已设为临时质量基线')).toBeVisible();
  await reportPanel.locator('[data-tour="transform-report-copy-quality-baseline-delta"]').click();
  await expect(page.getByText(/已复制质量对比（\d+ 字符 \/ [\d.]+ (?:B|KB|MB)）/)).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toContain('深度解析质量对比');
  const qualityDelta = await page.evaluate(() => window.localStorage.getItem('mock-clipboard') || '');
  expect(qualityDelta).toContain('覆盖率: 50 -> 50');
  expect(qualityDelta).toContain('待检查: 1 -> 1');
  expect(qualityDelta).not.toContain('raw=%7B%22nid%22%3A123%7D');
  await reportPanel.locator('[data-tour="transform-report-clear-quality-baseline"]').click();
  await expect(page.getByText('临时质量基线已清除')).toBeVisible();

  await expect(reportPanel.locator('[data-tour="transform-report-copy-archive-package"]')).toHaveAttribute('aria-label', '复制归档包，复制不含原始 response 的质量快照、脱敏问题样本和 corpus 沉淀清单');
  await reportPanel.locator('[data-tour="transform-report-copy-archive-package"]').click();
  await expect(page.getByText(/已复制归档包（\d+ 字符 \/ [\d.]+ (?:B|KB|MB)）/)).toBeVisible();
  const archivePackage = JSON.parse(await page.evaluate(() => window.localStorage.getItem('mock-clipboard') || '{}'));
  expect(archivePackage.kind).toBe('json-helper-transform-archive-package');
  expect(archivePackage.tool).toEqual(expectedToolMetadata);
  expect(archivePackage.safety.containsRawResponse).toBe(false);
  expect(archivePackage.artifacts.qualitySnapshot.tool).toEqual(expectedToolMetadata);
  expect(archivePackage.artifacts.issueSamples.tool).toEqual(expectedToolMetadata);
  expect(archivePackage.artifacts.qualitySnapshot.coverage.score).toBe(50);
  expect(archivePackage.artifacts.issueSamples.samples[0]).toMatchObject({
    type: 'unresolved',
    path: '$.tracking',
    originalValue: '[已省略，归档包默认不携带原始字段值]',
  });
  expect(archivePackage.corpusCandidate.recommendedFiles).toContain('sample-name.expected.snapshot.json');
  expect(JSON.stringify(archivePackage)).not.toContain('raw=%7B%22nid%22%3A123%7D');

  await unresolvedSection.locator('[data-tour="transform-report-open-unresolved-scheme"]').click();
  await expect(page.getByText('已填入 Scheme 解析')).toBeVisible();
  await expect(reportPanel).toBeHidden();
  const schemePanel = page.locator('[data-tour="scheme-panel"]');
  await expect(schemePanel).toBeVisible();
  await expect(schemePanel.locator('[data-tour="scheme-standalone-input"]')).toHaveValue('raw=%7B%22nid%22%3A123%7D');
});

test('深度解析报告可按不可逆计数筛选', async ({ page }) => {
  const extraParam = `AFD8f${encodeBase64('meg_name":"AI","flag":true}')}`;
  await fillSourceEditor(page, JSON.stringify({
    extra: extraParam,
    payload: JSON.stringify({ nested: true }),
  }));

  await page.locator('[data-tour="deep-format-btn"]').click();
  await expect(page.locator('[data-tour="preview-editor"]')).toContainText('不可逆 1');

  await page.locator('[data-tour="transform-report-button"]').click();
  const reportPanel = page.locator('[data-tour="transform-report-panel"]');
  await reportPanel.locator('[data-tour="transform-report-base64-count"]').click();
  await expect(reportPanel.locator('[data-tour="transform-report-filter"]')).toHaveValue('Base64');
  await expect(reportPanel.locator('[data-tour="transform-report-records"]')).toContainText('$.extra');
  await reportPanel.getByRole('button', { name: '清空' }).click();

  await reportPanel.locator('[data-tour="transform-report-non-reversible-count"]').click();

  await expect(reportPanel.locator('[data-tour="transform-report-filter"]')).toHaveValue('不可逆');
  await expect(reportPanel.locator('[data-tour="transform-report-records"]')).toContainText('$.extra');
  await expect(reportPanel.locator('[data-tour="transform-report-records"]')).toContainText('Base64 · 不可逆');
  await expect(reportPanel.locator('[data-tour="transform-report-records"]')).not.toContainText('$.payload');
});

test('深度解析报告可按 URL 计数筛选', async ({ page }) => {
  await fillSourceEditor(page, JSON.stringify({
    landing_url: 'https://example.com/page?from=feed&target=1',
    payload: JSON.stringify({ nested: true }),
  }));

  await page.locator('[data-tour="deep-format-btn"]').click();
  await expect(page.locator('[data-tour="preview-editor"]')).toContainText('URL 1');

  await page.locator('[data-tour="transform-report-button"]').click();
  const reportPanel = page.locator('[data-tour="transform-report-panel"]');
  await reportPanel.locator('[data-tour="transform-report-url-count"]').click();

  await expect(reportPanel.locator('[data-tour="transform-report-filter"]')).toHaveValue('URL Scheme');
  await expect(reportPanel.locator('[data-tour="transform-report-records"]')).toContainText('$.landing_url');
  await expect(reportPanel.locator('[data-tour="transform-report-records"]')).toContainText('URL Scheme · 可回写');
  await expect(reportPanel.locator('[data-tour="transform-report-records"]')).not.toContainText('$.payload');
});

test('深度解析报告可页面内对比 cmdHandler 输出', async ({ page }) => {
  const actionCmd = `cmd=${encodeURIComponent(JSON.stringify({
    nid: 123,
    category: 'jump',
  }))}&from=feed`;
  await fillSourceEditor(page, JSON.stringify({ action_cmd: actionCmd }));

  await page.locator('[data-tour="deep-format-btn"]').click();
  await page.locator('[data-tour="transform-report-button"]').click();

  const reportPanel = page.locator('[data-tour="transform-report-panel"]');
  const commandRow = reportPanel
    .locator('[data-tour="transform-report-row"]')
    .filter({ hasText: '$.action_cmd' });

  const nextActions = reportPanel.locator('[data-tour="transform-report-next-actions"]');
  await expect(nextActions).toContainText('对比 cmdHandler');
  await expect(nextActions).toContainText('复制归档包');
  await nextActions.locator('[data-tour="transform-report-next-action-compare-cmd"]').click();
  await expect(reportPanel.locator('[data-tour="transform-report-filter"]')).toHaveValue('CMD结构');
  const comparisonPanel = commandRow.locator('[data-tour="transform-report-cmd-comparison-panel"]');
  await expect(comparisonPanel).toBeVisible();
  await expect(comparisonPanel).toContainText('cmdHandler 对比');

  const cmdHandlerOutput = JSON.stringify({
    result: {
      cmdParams: {
        cmd: {
          nid: 456,
        },
        extra: 'expected',
      },
    },
  }, null, 2);
  await comparisonPanel.locator('[data-tour="transform-report-cmd-comparison-input"]').fill(`cmdHandler 输出:
\`\`\`json
${cmdHandlerOutput}
\`\`\``);

  await expect(comparisonPanel).toContainText('存在差异');
  await expect(comparisonPanel).toContainText('缺失 1');
  await expect(comparisonPanel).toContainText('额外 2');
  await expect(comparisonPanel).toContainText('值不一致 1');

  await comparisonPanel.locator('[data-tour="transform-report-copy-cmd-comparison-diff"]').click();
  await expect(page.getByText('已复制 CMD 差异报告').first()).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toContain('CMD 结构差异报告');
  const diffReport = await page.evaluate(() => window.localStorage.getItem('mock-clipboard') || '');
  expect(diffReport).toContain('缺失路径 1 个');
  expect(diffReport).toContain('额外路径 2 个');
  expect(diffReport).toContain('$.cmd.nid');

  await reportPanel.getByRole('button', { name: '复制排查报告' }).click();
  await expect(page.getByText(/已复制排查报告（\d+ 字符 \/ [\d.]+ (?:B|KB|MB)）/)).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toContain('深度解析协作排查报告');
  const collaborationReport = await page.evaluate(() => window.localStorage.getItem('mock-clipboard') || '');
  expect(collaborationReport).toContain('三、cmdHandler 对齐');
  expect(collaborationReport).toContain('CMD 结构差异报告');
  expect(collaborationReport).toContain('缺失路径 1 个');

  const cmdHandlerSubsetOutput = JSON.stringify({
    result: {
      cmdParams: {
        cmd: {
          nid: 123,
        },
      },
    },
  }, null, 2);
  await comparisonPanel.locator('[data-tour="transform-report-cmd-comparison-input"]').fill(`[cmdHandler] output =>
\`\`\`json
${cmdHandlerSubsetOutput}
\`\`\`
done`);
  await comparisonPanel.getByLabel('忽略 actual 额外路径').check();
  await expect(comparisonPanel).toContainText('结构一致');
  await expect(comparisonPanel).toContainText('已忽略额外');

  await comparisonPanel.locator('[data-tour="transform-report-copy-cmd-comparison-diff"]').click();
  await expect(page.getByText('已复制 CMD 差异报告').first()).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toContain('对比模式: 忽略 actual 额外路径');
  const subsetDiffReport = await page.evaluate(() => window.localStorage.getItem('mock-clipboard') || '');
  expect(subsetDiffReport).toContain('结构一致');
  expect(subsetDiffReport).toContain('已忽略 actual 额外路径');
});

test('cmdHandler 对比可推荐更匹配的 actual CMD', async ({ page }) => {
  await fillSourceEditor(page, JSON.stringify({
    action_cmd: 'sampleapp://v1/action?from=feed',
    panel_cmd: 'sampleapp://v1/panel?tab=reward',
  }));

  await page.locator('[data-tour="deep-format-btn"]').click();
  await page.locator('[data-tour="transform-report-button"]').click();

  const reportPanel = page.locator('[data-tour="transform-report-panel"]');
  await reportPanel.locator('[data-tour="transform-report-open-first-cmd-comparison"]').click();

  const actionRow = reportPanel
    .locator('[data-tour="transform-report-row"]')
    .filter({ hasText: '$.action_cmd' });
  const comparisonPanel = actionRow.locator('[data-tour="transform-report-cmd-comparison-panel"]');
  await expect(comparisonPanel).toBeVisible();

  const panelExpected = JSON.stringify({
    result: {
      cmdSchema: 'sampleapp://v1/panel',
      cmdParams: {
        tab: 'reward',
      },
    },
  }, null, 2);
  await comparisonPanel.locator('[data-tour="transform-report-cmd-comparison-input"]').fill(panelExpected);

  await expect(comparisonPanel.locator('[data-tour="transform-report-cmd-candidate-recommendations"]'))
    .toContainText('可能拿错 actual');
  const panelCandidate = comparisonPanel
    .locator('[data-tour="transform-report-cmd-candidate"]')
    .filter({ hasText: '$.panel_cmd' });
  await expect(panelCandidate).toContainText('结构一致');

  await reportPanel.getByRole('button', { name: '复制排查报告' }).click();
  await expect(page.getByText(/已复制排查报告（\d+ 字符 \/ [\d.]+ (?:B|KB|MB)）/)).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toContain('cmdHandler actual 候选推荐');
  const collaborationReport = await page.evaluate(() => window.localStorage.getItem('mock-clipboard') || '');
  expect(collaborationReport).toContain('可能拿错 actual');
  expect(collaborationReport).toContain('#1 $.panel_cmd');

  await panelCandidate.click();

  const panelRow = reportPanel
    .locator('[data-tour="transform-report-row"]')
    .filter({ hasText: '$.panel_cmd' });
  const switchedPanel = panelRow.locator('[data-tour="transform-report-cmd-comparison-panel"]');
  await expect(switchedPanel).toBeVisible();
  await expect(switchedPanel).toContainText('结构一致');
  await expect(switchedPanel.locator('[data-tour="transform-report-cmd-candidate-recommendations"]'))
    .toContainText('当前 actual 已是最匹配候选');
});

test('cmdHandler actual 候选推荐会扫描根 CMD 内层结构', async ({ page }) => {
  const rootPath = '$.data.video[0].material[0].info[0].ad_common.scheme';
  const landingUrl = 'https://example.com/landing?sku=101';
  const panelCmd = `sampleapp://v7/vendor/ad/deeplink?params=${encodeURIComponent(JSON.stringify({
    appUrl: `openapp.jdmobile://virtual?params=${encodeURIComponent(JSON.stringify({
      category: 'jump',
      url: landingUrl,
    }))}`,
    webUrl: `sampleapp://v1/browser/open?url=${encodeURIComponent(landingUrl)}`,
  }))}`;
  const rootScheme = `samplevendor://vendor/ad/rewardImpl?panel=${encodeURIComponent(JSON.stringify({
    panel_cmd: panelCmd,
    webpanel_cmd: panelCmd,
  }))}`;

  await fillSourceEditor(page, JSON.stringify({
    data: {
      video: [{
        material: [{
          info: [{
            ad_common: {
              scheme: rootScheme,
            },
          }],
        }],
      }],
    },
  }));

  await page.locator('[data-tour="deep-format-btn"]').click();
  await page.locator('[data-tour="transform-report-button"]').click();

  const reportPanel = page.locator('[data-tour="transform-report-panel"]');
  await reportPanel.locator('[data-tour="transform-report-open-first-cmd-comparison"]').click();

  const rootRow = reportPanel
    .locator('[data-tour="transform-report-row"]')
    .filter({ hasText: rootPath });
  const comparisonPanel = rootRow.locator('[data-tour="transform-report-cmd-comparison-panel"]');
  await expect(comparisonPanel).toBeVisible();

  await comparisonPanel.locator('[data-tour="transform-report-cmd-comparison-input"]').fill(JSON.stringify({
    result: {
      cmdSchema: 'sampleapp://v7/vendor/ad/deeplink',
      cmdParams: {
        params: {},
      },
    },
  }, null, 2));
  await comparisonPanel.getByLabel('忽略 actual 额外路径').check();

  const panelCmdCandidate = comparisonPanel
    .locator('[data-tour="transform-report-cmd-candidate"]')
    .filter({ hasText: `${rootPath}.cmdParams.panel.panel_cmd` })
    .first();
  await expect(panelCmdCandidate).toContainText('结构一致');

  await panelCmdCandidate.click();

  await expect(reportPanel.locator('[data-tour="transform-report-filter"]')).toHaveValue(rootPath);
  await expect(comparisonPanel).toContainText('结构一致');
  await expect(comparisonPanel.locator('[data-tour="transform-report-cmd-candidate-recommendations"]'))
    .toContainText('当前 actual 已是最匹配候选');
});

test('cmdHandler actual 候选推荐会扫描截断列表后的 CMD', async ({ page }) => {
  const response = Object.fromEntries(Array.from({ length: 205 }, (_, index) => {
    const key = `item_${index.toString().padStart(3, '0')}_cmd`;
    const value = index === 204
      ? 'sampleapp://v1/panel?tab=reward'
      : `sampleapp://v1/action?from=feed&idx=${index}`;

    return [key, value];
  }));
  await fillSourceEditor(page, JSON.stringify(response));

  await page.locator('[data-tour="deep-format-btn"]').click();
  await page.locator('[data-tour="transform-report-button"]').click();

  const reportPanel = page.locator('[data-tour="transform-report-panel"]');
  await reportPanel.locator('[data-tour="transform-report-open-first-cmd-comparison"]').click();

  const firstRow = reportPanel
    .locator('[data-tour="transform-report-row"]')
    .filter({ hasText: '$.item_000_cmd' });
  const comparisonPanel = firstRow.locator('[data-tour="transform-report-cmd-comparison-panel"]');
  await expect(comparisonPanel).toBeVisible();

  const panelExpected = JSON.stringify({
    result: {
      cmdSchema: 'sampleapp://v1/panel',
      cmdParams: {
        tab: 'reward',
      },
    },
  }, null, 2);
  await comparisonPanel.locator('[data-tour="transform-report-cmd-comparison-input"]').fill(panelExpected);

  const tailCandidate = comparisonPanel
    .locator('[data-tour="transform-report-cmd-candidate"]')
    .filter({ hasText: '$.item_204_cmd' });
  await expect(tailCandidate).toContainText('结构一致');

  await tailCandidate.click();
  await expect(reportPanel.locator('[data-tour="transform-report-filter"]')).toHaveValue('$.item_204_cmd');

  const tailRow = reportPanel
    .locator('[data-tour="transform-report-row"]')
    .filter({ hasText: '$.item_204_cmd' });
  const switchedPanel = tailRow.locator('[data-tour="transform-report-cmd-comparison-panel"]');
  await expect(switchedPanel).toBeVisible();
  await expect(switchedPanel).toContainText('结构一致');
});

test('cmdHandler 聚焦对比复制报告保持当前筛选范围', async ({ page }) => {
  const actionCmd = `cmd=${encodeURIComponent(JSON.stringify({
    nid: 123,
    category: 'jump',
  }))}&from=feed`;
  await fillSourceEditor(page, JSON.stringify({ action_cmd: actionCmd }));

  await page.locator('[data-tour="deep-format-btn"]').click();
  await page.locator('[data-tour="transform-report-button"]').click();

  const reportPanel = page.locator('[data-tour="transform-report-panel"]');
  await reportPanel.locator('[data-tour="transform-report-filter"]').fill('category');
  const commandRow = reportPanel
    .locator('[data-tour="transform-report-row"]')
    .filter({ hasText: '$.action_cmd' });
  await commandRow.locator('[data-tour="transform-report-open-cmd-comparison"]').click();

  const comparisonPanel = commandRow.locator('[data-tour="transform-report-cmd-comparison-panel"]');
  const categoryExpected = JSON.stringify({
    result: {
      cmdParams: {
        cmd: {
          category: 'jump',
        },
      },
    },
  }, null, 2);
  await comparisonPanel.locator('[data-tour="transform-report-cmd-comparison-input"]').fill(categoryExpected);
  await comparisonPanel.getByLabel('忽略 actual 额外路径').check();
  await expect(comparisonPanel).toContainText('结构一致');

  await reportPanel.getByRole('button', { name: '复制排查报告' }).click();
  await expect(page.getByText(/已复制排查报告（\d+ 字符 \/ [\d.]+ (?:B|KB|MB)）/)).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toContain('CMD 结构差异报告');
  const collaborationReport = await page.evaluate(() => window.localStorage.getItem('mock-clipboard') || '');
  expect(collaborationReport).toContain('筛选: category');
  expect(collaborationReport).toContain('结构一致');
  expect(collaborationReport).not.toContain('- 额外路径');
});

test('深度解析报告内部CMD字段可直接打开 Scheme 面板', async ({ page }) => {
  const innerCmd = {
    cmdSchema: 'sampleapp://v1/browser/open',
    cmdParams: {
      url: 'https://example.com/page',
      source: 'feed',
    },
  };
  const actionCmd = `cmd=${encodeURIComponent(JSON.stringify({
    convert_cmd: innerCmd,
    title: 'outer',
  }))}&from=feed`;

  await fillSourceEditor(page, JSON.stringify({ action_cmd: actionCmd }));
  await page.locator('[data-tour="deep-format-btn"]').click();
  await page.locator('[data-tour="transform-report-button"]').click();

  const reportPanel = page.locator('[data-tour="transform-report-panel"]');
  const nestedCmdField = reportPanel
    .locator('[data-tour="transform-report-nested-cmd-field"]')
    .filter({ hasText: '$.action_cmd.cmd.convert_cmd' });

  await expect(nestedCmdField).toContainText('sampleapp://v1/browser/open');
  await nestedCmdField.locator('[data-tour="transform-report-open-nested-cmd-scheme"]').click();
  await expect(page.getByText('已填入 Scheme 解析')).toBeVisible();
  await expect(reportPanel).toBeHidden();

  const schemePanel = page.locator('[data-tour="scheme-panel"]');
  await expect(schemePanel).toBeVisible();
  await expect(schemePanel.locator('[data-tour="scheme-standalone-input"]')).toHaveValue(JSON.stringify(innerCmd, null, 2));
  await expandSchemeDetails(page);
  await expect(schemePanel.locator('[data-tour="scheme-command-summary"]')).toContainText('cmdParams · 2');
});

test('深度解析报告展示运行时占位符', async ({ page }) => {
  const actionCmd = `cmd=${encodeURIComponent(JSON.stringify({
    button_cmd: '__CONVERT_CMD__',
  }))}&from=feed`;
  await fillSourceEditor(page, JSON.stringify({ action_cmd: actionCmd }));

  await page.locator('[data-tour="deep-format-btn"]').click();
  await expect(page.locator('[data-tour="preview-editor"]')).toContainText('占位符 1');
  await expectPreviewText(page, '"button_cmd": "__CONVERT_CMD__"');

  await page.locator('[data-tour="transform-report-button"]').click();
  const reportPanel = page.locator('[data-tour="transform-report-panel"]');
  const placeholderSection = reportPanel.locator('[data-tour="transform-report-placeholders"]');

  await expect(reportPanel.locator('[data-tour="transform-report-cmd-count"]')).toHaveText('CMD 1');
  await reportPanel.locator('[data-tour="transform-report-cmd-count"]').click();
  await expect(reportPanel.locator('[data-tour="transform-report-filter"]')).toHaveValue('CMD 参数');
  await expect(reportPanel.locator('[data-tour="transform-report-records"]')).toContainText('$.action_cmd');
  await reportPanel.getByRole('button', { name: '清空' }).click();

  await expect(reportPanel.locator('[data-tour="transform-report-cmd-structure-count"]')).toHaveText('CMD结构 1');
  await reportPanel.locator('[data-tour="transform-report-cmd-structure-count"]').click();
  await expect(reportPanel.locator('[data-tour="transform-report-filter"]')).toHaveValue('CMD结构');
  await expect(reportPanel.locator('[data-tour="transform-report-records"]')).toContainText('$.action_cmd');
  await reportPanel.getByRole('button', { name: '清空' }).click();
  await reportPanel.locator('[data-tour="transform-report-placeholder-count"]').click();
  await expect(reportPanel.locator('[data-tour="transform-report-filter"]')).toHaveValue('占位符');
  await expect(placeholderSection).toContainText('$.action_cmd.cmd.button_cmd');
  await reportPanel.getByRole('button', { name: '清空' }).click();
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
  await reportPanel
    .locator('[data-tour="transform-report-row"]')
    .filter({ hasText: '$.action_cmd' })
    .locator('[data-tour="transform-report-copy-cmd-structure"]')
    .click();
  await expect(page.getByText('已复制 CMD 结构')).toBeVisible();
  const copiedCmdStructure = await page.evaluate(() => window.localStorage.getItem('mock-clipboard'));
  expect(JSON.parse(copiedCmdStructure || '')).toEqual({
    result: {
      cmdParams: {
        cmd: {
          button_cmd: '__CONVERT_CMD__',
        },
        from: 'feed',
      },
      source: actionCmd,
    },
  });
  await reportPanel.locator('[data-tour="transform-report-copy-cmd-structures"]').click();
  await expect(page.getByText('已复制 CMD 结构列表')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toContain('路径: $.action_cmd');
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toContain('"button_cmd": "__CONVERT_CMD__"');
  await placeholderGroups.locator('[data-tour="transform-report-filter-placeholder-group"]').click();
  await expect(reportPanel.locator('[data-tour="transform-report-filter"]')).toHaveValue('__CONVERT_CMD__');
  await reportPanel.getByRole('button', { name: '复制筛选结果' }).click();
  await expect(page.getByText(/已复制筛选结果（\d+ 字符 \/ [\d.]+ (?:B|KB|MB)）/)).toBeVisible();
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

  await placeholderSection.locator('[data-tour="transform-report-copy-placeholder-source-path"]').click();
  await expect(page.getByText('已复制来源路径')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toBe('$.action_cmd');

  await placeholderSection.locator('[data-tour="transform-report-copy-placeholder-source-value"]').click();
  await expect(page.getByText('已复制来源值')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toBe(actionCmd);

  await placeholderSection.locator('[data-tour="transform-report-open-placeholder-source-scheme"]').click();
  await expect(page.getByText('已填入 Scheme 解析')).toBeVisible();
  await expect(reportPanel).toBeHidden();
  const schemePanel = page.locator('[data-tour="scheme-panel"]');
  await expect(schemePanel).toBeVisible();
  await expect(schemePanel.locator('[data-tour="scheme-standalone-input"]')).toHaveValue(actionCmd);
});

test('占位符回填后展示解析质量变化', async ({ page }) => {
  const replacementCmd = `cmd=${encodeURIComponent(JSON.stringify({ nid: 123 }))}`;
  await fillSourceEditor(page, JSON.stringify({ button_cmd: '__CONVERT_CMD__' }));

  await page.locator('[data-tour="deep-format-btn"]').click();
  await page.locator('[data-tour="transform-report-button"]').click();
  const reportPanel = page.locator('[data-tour="transform-report-panel"]');

  await reportPanel.locator('[data-tour="transform-report-open-placeholder-fill-shortcut"]').click();
  await expect(page.getByText('已填入模板填充')).toBeVisible();

  const templatePanel = page.locator('[data-tour="template-fill-panel"]');
  await expect(templatePanel).toBeVisible();
  await expect(templatePanel.locator('[data-tour="template-fill-placeholder-form"]')).toBeVisible();
  const replacementInput = templatePanel.locator('[data-tour="template-fill-placeholder-replacement"]').first();
  await replacementInput.fill(replacementCmd);
  await expect(templatePanel.locator('[data-tour="template-fill-placeholder-summary"]')).toContainText('replacement 1/1');

  await templatePanel.locator('[data-tour="template-apply-button"]').click();
  await expect(page.getByText('占位符已回填，质量对比已更新')).toBeVisible();

  const qualityDelta = templatePanel.locator('[data-tour="template-fill-quality-delta"]');
  await expect(qualityDelta).toContainText('深度解析质量对比');
  await expect(qualityDelta).toContainText('CMD结构: 0 -> 1 (+1)');
  await expect(qualityDelta).toContainText('占位符: 1 -> 0 (-1)');
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText(replacementCmd);

  await expect(templatePanel.locator('[data-tour="template-fill-copy-quality-delta"]')).toHaveAttribute('title', '复制最近回填质量变化');
  await expect(templatePanel.locator('[data-tour="template-fill-copy-quality-delta"]')).toHaveAttribute('aria-label', '复制质量对比，复制最近回填质量变化');
  await templatePanel.locator('[data-tour="template-fill-copy-quality-delta"]').click();
  await expect(page.getByText(/已复制质量对比（\d+ 字符 \/ [\d.]+ (?:B|KB|MB)）/)).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toContain('占位符: 1 -> 0 (-1)');
});

test('占位符筛选后回填模板保留候选值', async ({ page }) => {
  const extraParamValue = `cmd=${encodeURIComponent(JSON.stringify({ aid: 'extra-1' }))}`;
  await fillSourceEditor(page, JSON.stringify({
    extra: [
      {
        k: 'extraParam',
        v: extraParamValue,
      },
    ],
    action_cmd: `cmd=${encodeURIComponent(JSON.stringify({
      ext: '__AD_EXTRA_PARAM_ENCODE_1__',
    }))}`,
  }));

  await page.locator('[data-tour="deep-format-btn"]').click();
  await page.locator('[data-tour="transform-report-button"]').click();
  const reportPanel = page.locator('[data-tour="transform-report-panel"]');

  await reportPanel.locator('[data-tour="transform-report-placeholder-count"]').click();
  await expect(reportPanel.locator('[data-tour="transform-report-filter"]')).toHaveValue('占位符');
  await reportPanel.locator('[data-tour="transform-report-copy-placeholder-fill-template"]').click();
  const copiedTemplate = JSON.parse(await page.evaluate(() => window.localStorage.getItem('mock-clipboard') || '{}')) as {
    placeholders: Record<string, string>;
    placeholderDetails: Array<{ value: string; suggestion?: { sourcePath?: string; sourceLabel?: string } }>;
  };

  expect(copiedTemplate.placeholders.__AD_EXTRA_PARAM_ENCODE_1__).toBe(extraParamValue);
  expect(copiedTemplate.placeholderDetails.find(detail => (
    detail.value === '__AD_EXTRA_PARAM_ENCODE_1__'
  ))?.suggestion).toMatchObject({
    sourcePath: '$.extra[0].v',
    sourceLabel: 'extraParam',
  });

  const placeholderFillShortcut = reportPanel.locator('[data-tour="transform-report-open-placeholder-fill-shortcut"]');
  await expect(placeholderFillShortcut).toContainText('回填占位符 1/1');
  await expect(placeholderFillShortcut).toHaveAttribute('title', /已预填 1\/1，候选 1，待补 0/);
  await placeholderFillShortcut.click();
  await expect(page.getByText('已填入模板填充')).toBeVisible();

  const templatePanel = page.locator('[data-tour="template-fill-panel"]');
  await expect(templatePanel).toBeVisible();
  const placeholderSummary = templatePanel.locator('[data-tour="template-fill-placeholder-summary"]');
  await expect(placeholderSummary).toContainText('replacement 1/1');
  await expect(placeholderSummary).toContainText('候选 1');
  const replacementInput = templatePanel.locator('[data-tour="template-fill-placeholder-replacement"]').first();
  await expect(replacementInput).toHaveValue(extraParamValue);
  await replacementInput.fill('');
  await expect(placeholderSummary).toContainText('待补 1');
  await templatePanel.locator('[data-tour="template-fill-use-suggestion"]').first().click();
  await expect(replacementInput).toHaveValue(extraParamValue);
  await expect(page.getByText('已采用候选 replacement')).toBeVisible();
});

test('JSON Lines 校验错误展示具体行号', async ({ page }) => {
  await fillSourceEditor(page, '{"ok":1}\n{"broken":}\n{"ok":3}');

  await expect(page.locator('[data-tour="editor-error-message"]')).toContainText('JSON Lines 第 2 行解析错误');
  const locateErrorButton = page.getByRole('button', { name: /SOURCE 定位到第 2 行，第 \d+ 列/ });
  await expect(locateErrorButton).toHaveAttribute('title', /SOURCE 定位到第 2 行，第 \d+ 列/);
  await locateErrorButton.click();
  await expect(page.locator('[data-tour="statusbar"]')).toContainText('Ln 2');

  const copyErrorButton = page.getByRole('button', { name: 'SOURCE 复制错误信息' });
  await expect(copyErrorButton).toHaveAttribute('title', 'SOURCE 复制错误信息');
  await copyErrorButton.click();
  await expect(page.getByText('已复制错误信息')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toContain('JSON Lines 第 2 行解析错误');
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

  await page.locator('[data-tour="copy-preview"]').click();
  await expect(page.getByText(/已复制预览内容（\d+ 字符 \/ \d+ B）/)).toBeVisible();
  const copiedResult = await page.evaluate(() => window.localStorage.getItem('mock-clipboard'));
  expect(copiedResult).toContain('"copy": true');
});

test('源编辑区可复制并确认清空内容', async ({ page }) => {
  const sourceText = '{"sourceOps":true,"items":[1,2,3]}';
  await expect(page.locator('[data-tour="copy-source"]')).toHaveAttribute('title', 'SOURCE 为空，暂无内容可复制');
  await expect(page.locator('[data-tour="copy-source"]')).toHaveAttribute('aria-label', 'SOURCE 为空，暂无内容可复制');
  await expect(page.locator('[data-tour="clear-source"]')).toHaveAttribute('title', 'SOURCE 为空，暂无内容可清空');
  await expect(page.locator('[data-tour="clear-source"]')).toHaveAttribute('aria-label', 'SOURCE 为空，暂无内容可清空');
  await fillSourceEditor(page, sourceText);
  await expect(page.locator('[data-tour="copy-source"]')).toHaveAttribute('title', '复制 SOURCE 内容到剪贴板');
  await expect(page.locator('[data-tour="copy-source"]')).toHaveAttribute('aria-label', '复制 SOURCE 内容到剪贴板');
  await expect(page.locator('[data-tour="clear-source"]')).toHaveAttribute('title', '清空 SOURCE 内容');
  await expect(page.locator('[data-tour="clear-source"]')).toHaveAttribute('aria-label', '清空 SOURCE 内容');

  await page.locator('[data-tour="copy-source"]').click();
  await expect(page.getByText(`已复制源内容（${sourceText.length} 字符 / ${Buffer.byteLength(sourceText, 'utf8')} B）`)).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toBe(sourceText);

  await page.locator('[data-tour="clear-source"]').click();
  const dialog = page.locator('[data-tour="confirm-dialog"]');
  await expect(dialog).toContainText('清空源内容');
  await expect(dialog).toContainText(`当前 SOURCE: ${sourceText.length} 字符 / ${Buffer.byteLength(sourceText, 'utf8')} B`);
  await dialog.getByRole('button', { name: '继续保留' }).click();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('sourceOps');

  await page.locator('[data-tour="clear-source"]').click();
  await page.locator('[data-tour="confirm-dialog"]').getByRole('button', { name: '清空' }).click();
  await expect(page.getByText('源内容已清空')).toBeVisible();
  await expect(page.locator('[data-tour="statusbar"]')).toContainText('Length: 0');
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).not.toContainText('sourceOps');
});

test('源编辑区可从剪贴板粘贴并确认替换内容', async ({ page }) => {
  await page.evaluate(() => window.localStorage.setItem('mock-clipboard', '{"pasted":true}'));

  await page.locator('[data-tour="paste-source"]').click();
  await expect(page.getByText('已从剪贴板粘贴到 SOURCE（15 字符 / 15 B）')).toBeVisible();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('pasted');

  await page.evaluate(() => window.localStorage.setItem('mock-clipboard', '{"replaced":true}'));
  await page.locator('[data-tour="paste-source"]').click();
  const dialog = page.locator('[data-tour="confirm-dialog"]');
  await expect(dialog).toContainText('替换源内容');
  await expect(dialog).toContainText('当前 SOURCE: 15 字符 / 15 B');
  await expect(dialog).toContainText('剪贴板文本: 17 字符 / 17 B');
  await dialog.getByRole('button', { name: '继续保留' }).click();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('pasted');

  await page.locator('[data-tour="paste-source"]').click();
  await page.locator('[data-tour="confirm-dialog"]').getByRole('button', { name: '替换' }).click();
  await expect(page.getByText('已用剪贴板内容替换 SOURCE（17 字符 / 17 B）')).toBeVisible();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('replaced');
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).not.toContainText('pasted');
});

test('预览结果可确认应用回源编辑区', async ({ page }) => {
  const sourceText = '{"previewApply":true,"items":[2,1]}';
  await expect(page.locator('[data-tour="apply-preview-to-source"]')).toHaveAttribute('title', '暂无 PREVIEW 内容可应用');
  await expect(page.locator('[data-tour="apply-preview-to-source"]')).toHaveAttribute('aria-label', '暂无 PREVIEW 内容可应用');
  await expect(page.locator('[data-tour="copy-preview"]')).toHaveAttribute('title', '暂无 PREVIEW 内容可复制');
  await expect(page.locator('[data-tour="copy-preview"]')).toHaveAttribute('aria-label', '暂无 PREVIEW 内容可复制');

  await fillSourceEditor(page, sourceText);
  await page.getByRole('button', { name: '格式化' }).click();
  await expectPreviewText(page, '"previewApply": true');
  await expect(page.locator('[data-tour="apply-preview-to-source"]')).toHaveAttribute('title', '用 PREVIEW 内容替换 SOURCE');
  await expect(page.locator('[data-tour="apply-preview-to-source"]')).toHaveAttribute('aria-label', '用 PREVIEW 内容替换 SOURCE');
  await expect(page.locator('[data-tour="copy-preview"]')).toHaveAttribute('title', '复制预览内容到剪贴板');
  await expect(page.locator('[data-tour="copy-preview"]')).toHaveAttribute('aria-label', '复制预览内容到剪贴板');

  await page.locator('[data-tour="apply-preview-to-source"]').click();
  const dialog = page.locator('[data-tour="confirm-dialog"]');
  await expect(dialog).toContainText('应用预览到源');
  await expect(dialog).toContainText(`当前 SOURCE: ${sourceText.length} 字符 / ${Buffer.byteLength(sourceText, 'utf8')} B`);
  await expect(dialog).toContainText(/PREVIEW: \d+ 字符 \/ \d+ B/);
  await dialog.getByRole('button', { name: '继续保留' }).click();

  await page.locator('[data-tour="copy-source"]').click();
  await expect(page.getByText(/已复制源内容（\d+ 字符 \/ \d+ B）/)).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toBe(sourceText);

  await page.locator('[data-tour="apply-preview-to-source"]').click();
  await page.locator('[data-tour="confirm-dialog"]').getByRole('button', { name: '应用' }).click();
  await expect(page.getByText(/已用 PREVIEW 替换 SOURCE（\d+ 字符 \/ \d+ B）/)).toBeVisible();
  await page.locator('[data-tour="copy-source"]').click();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toContain('"previewApply": true');
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toContain('"items": [');
  await expect(page.locator('[data-tour="apply-preview-to-source"]')).toHaveAttribute('title', 'PREVIEW 与 SOURCE 内容一致，无需应用');
  await expect(page.locator('[data-tour="apply-preview-to-source"]')).toHaveAttribute('aria-label', 'PREVIEW 与 SOURCE 内容一致，无需应用');
});

test('预览复制失败时展示浏览器拒绝原因', async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    document.execCommand = () => false;
  });

  await fillSourceEditor(page, '{"copy":false}');
  await page.getByRole('button', { name: '格式化' }).click();
  await expectPreviewText(page, '"copy": false');

  await page.locator('[data-tour="copy-preview"]').click();
  await expect(page.getByText('浏览器拒绝复制操作')).toBeVisible();
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
  await waitForMainAppReady(page);

  await page.locator('[data-tour="settings"]').click();
  await page.getByRole('tab', { name: 'AI 配置' }).click();
  await expect(page.getByText('AI 提供商')).toBeVisible();
});

test('设置弹窗支持键盘关闭并恢复焦点', async ({ page }) => {
  const settingsButton = page.locator('[data-tour="settings"]');
  await settingsButton.click();

  const settingsDialog = page.getByRole('dialog', { name: '设置' });
  await expect(settingsDialog).toBeVisible();
  await expect(settingsDialog.getByRole('button', { name: '关闭设置' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(settingsDialog).toBeHidden();
  await expect(settingsButton).toBeFocused();
});

test('通用设置开关提供可访问状态并支持键盘切换', async ({ page }) => {
  await page.locator('[data-tour="settings"]').click();
  await page.getByRole('tab', { name: '通用设置' }).click();

  const autoExpandSwitch = page.getByRole('switch', { name: '嵌套解析时自动展开 CMD/Scheme 字符串' });
  await expect(autoExpandSwitch).toHaveAttribute('aria-checked', 'true');

  await autoExpandSwitch.focus();
  await page.keyboard.press('Space');
  await expect(autoExpandSwitch).toHaveAttribute('aria-checked', 'false');
});

test('设置页签支持方向键切换并同步选中状态', async ({ page }) => {
  await page.locator('[data-tour="settings"]').click();

  const settingsDialog = page.getByRole('dialog', { name: '设置' });
  const shortcutsTab = settingsDialog.getByRole('tab', { name: '快捷键' });
  const aiTab = settingsDialog.getByRole('tab', { name: 'AI 配置' });
  const generalTab = settingsDialog.getByRole('tab', { name: '通用设置' });

  await expect(shortcutsTab).toHaveAttribute('aria-selected', 'true');

  await shortcutsTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(aiTab).toBeFocused();
  await expect(aiTab).toHaveAttribute('aria-selected', 'true');
  await expect(settingsDialog.getByRole('tabpanel', { name: 'AI 配置' })).toBeVisible();

  await page.keyboard.press('End');
  await expect(generalTab).toBeFocused();
  await expect(generalTab).toHaveAttribute('aria-selected', 'true');
  await expect(settingsDialog.getByRole('tabpanel', { name: '通用设置' })).toBeVisible();

  await page.keyboard.press('Home');
  await expect(shortcutsTab).toBeFocused();
  await expect(shortcutsTab).toHaveAttribute('aria-selected', 'true');
});

test('快捷键冲突会提示被解除的动作', async ({ page }) => {
  await page.locator('[data-tour="settings"]').click();

  const saveShortcut = page.locator('[data-tour="shortcut-card-SAVE"]');
  const formatShortcut = page.locator('[data-tour="shortcut-card-FORMAT"]');

  await saveShortcut.click();
  await page.keyboard.press('Control+Shift+K');
  await expect(saveShortcut).toContainText('Ctrl');
  await expect(saveShortcut).toContainText('Shift');
  await expect(saveShortcut).toContainText('K');

  await formatShortcut.click();
  await page.keyboard.press('Control+Shift+K');

  await expect(page.locator('[data-tour="shortcut-conflict-notice"]')).toContainText('已解除「保存」的快捷键');
  await expect(saveShortcut).toContainText('未设置');
  await expect(formatShortcut).toContainText('Ctrl');
  await expect(formatShortcut).toContainText('Shift');
  await expect(formatShortcut).toContainText('K');
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
  await waitForMainAppReady(page);

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
  await page.getByRole('tab', { name: '通用设置' }).click();
  const generalSettingCard = page
    .getByText('嵌套解析时自动展开 CMD/Scheme 字符串')
    .locator('xpath=ancestor::div[contains(@class, "bg-editor-bg")][1]');
  await generalSettingCard.locator('button').click();
  await page.getByRole('button', { name: '保存设置' }).click();
  await expect(page.locator('#action-panel-content').getByText('JSONUtils', { exact: true })).toBeVisible();

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
  await waitForMainAppReady(page);
  await page.getByRole('button', { name: 'JSONPath 查询' }).click();

  const panel = page.locator('[data-tour="jsonpath-panel"]');
  await expect(panel).toBeVisible({ timeout: 30_000 });

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
  await waitForMainAppReady(page);
  await page.locator('[data-tour="settings"]').click();
  await page.getByRole('tab', { name: '通用设置' }).click();
  await page.getByRole('button', { name: '恢复默认布局' }).click();
  await expect(page.getByText('浮动面板布局已恢复默认')).toBeVisible();
  await page.getByRole('button', { name: '取消' }).click();

  await page.getByRole('button', { name: 'JSONPath 查询' }).click();
  const jsonPathPanel = page.locator('[data-tour="jsonpath-panel"]');
  await expect(jsonPathPanel).toBeVisible({ timeout: 30_000 });
  const box = await jsonPathPanel.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.round(box!.x)).toBe(100);
  expect(Math.round(box!.y)).toBe(100);
  expect(Math.round(box!.width)).toBe(600);
  expect(Math.round(box!.height)).toBe(400);
});

test('设置中可导出并导入配置备份', async ({ page }) => {
  await page.evaluate(() => {
    window.localStorage.setItem('jsonpath-query-favorites', JSON.stringify(['$.exported']));
    window.localStorage.setItem('json-tree-search-history', JSON.stringify(['cmdSchema']));
    window.localStorage.setItem('json-helper-template-fill', JSON.stringify({
      template: '{"before":1}',
      lastUpdated: 1,
    }));
    window.localStorage.setItem('jsonpath-panel-position', JSON.stringify({ x: 220, y: 160 }));
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForMainAppReady(page);
  await page.locator('[data-tour="settings"]').click();
  await page.getByRole('tab', { name: '通用设置' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出配置备份' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^jsonutils-backup-.*\.json$/);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const exportedBackup = JSON.parse(await readFile(downloadPath!, 'utf-8')) as {
    settings: { ai: { apiKey: string } };
    jsonPath: { favorites: string[] };
    jsonSchema: { library: unknown[] };
    structureNav: { searchHistory: string[] };
    templateFill: { template: string };
  };
  expect(exportedBackup.settings.ai.apiKey).toBe('');
  expect(exportedBackup.jsonPath.favorites).toEqual(['$.exported']);
  expect(exportedBackup.jsonSchema.library).toEqual([]);
  expect(exportedBackup.structureNav.searchHistory).toEqual(['cmdSchema']);
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
    jsonSchema: {
      library: [],
    },
    structureNav: {
      searchHistory: [' importedField ', 'phone', 'phone'],
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

  await page.locator('[data-tour="structure-nav-button"]').click();
  const structurePanel = page.getByRole('dialog', { name: 'JSON 结构导航' });
  await expect(structurePanel.locator('[data-tour="structure-nav-search-history"]')).toContainText('importedField');
  await expect(structurePanel.locator('[data-tour="structure-nav-search-history"]')).toContainText('phone');
});

test('JSONPath 面板可查询预览数据', async ({ page }) => {
  await fillSourceEditor(page, JSON.stringify({
    users: [
      { name: 'Ada', age: 20 },
      { name: 'Bob', age: 17 },
    ],
    meta: {
      action_cmd: 'sampleapp://v7/vendor/ad/open?params=%7B%22nid%22%3A123%7D',
      traceId: 'trace-jsonpath-1',
      'trace.id': 'trace-dot-1',
    },
  }));

  await page.getByRole('button', { name: 'JSONPath 查询' }).click();
  const queryButton = page.locator('[data-tour="jsonpath-query-button"]');
  const favoriteToggle = page.locator('[data-tour="jsonpath-favorite-toggle"]');
  const resultPreview = page.locator('[data-tour="jsonpath-results"]');
  const queryInput = page.locator('[data-tour="jsonpath-input"]');

  await expect(queryButton).toHaveAttribute('title', '执行 JSONPath 查询');
  await expect(queryInput).toHaveAttribute('aria-label', 'JSONPath 表达式');
  await expect(queryInput).toHaveAttribute('placeholder', '输入 JSONPath 表达式或字段名');
  await queryInput.fill('   ');
  await expect(queryButton).toHaveAttribute('title', '请输入 JSONPath 表达式或字段名后查询');
  await expect(page.locator('#jsonpath-query-button-description')).toHaveText('请输入 JSONPath 表达式或字段名后查询');
  await expect(favoriteToggle).toBeDisabled();
  await expect(favoriteToggle).toHaveAttribute('title', '请输入 JSONPath 表达式或字段名后可收藏');
  await expect(favoriteToggle).toHaveAttribute('aria-label', '请输入 JSONPath 表达式或字段名后可收藏');
  await queryButton.click();
  await expect(page.getByText('请输入 JSONPath 表达式或字段名', { exact: true })).toBeVisible();
  await expect(queryInput).toHaveAttribute('aria-invalid', 'true');
  await expect(queryInput).toHaveAttribute('aria-describedby', 'jsonpath-error-message');
  await expect(page.locator('#jsonpath-error-message')).toHaveAttribute('role', 'alert');
  await expect(page.locator('#jsonpath-error-message')).toContainText('请输入 JSONPath 表达式');

  await queryInput.fill('$.missing');
  await expect(favoriteToggle).toHaveAttribute('title', '收藏当前查询');
  await queryButton.click();
  await expect(page.locator('[data-tour="jsonpath-empty"]')).toContainText('未命中任何结果');
  await expect(page.locator('[data-tour="jsonpath-empty"]')).toContainText('$.missing');
  await expect(page.locator('[data-tour="jsonpath-empty"]')).toHaveAttribute('role', 'status');
  await expect(page.locator('[data-tour="jsonpath-empty"]')).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('[data-tour="jsonpath-empty-clear"]')).toHaveAttribute('title', '清空当前 JSONPath 查询');
  await expect(page.locator('[data-tour="jsonpath-empty-clear"]')).toHaveAttribute('aria-label', '清空当前 JSONPath 查询');
  await page.locator('[data-tour="jsonpath-empty-clear"]').click();
  await expect(queryInput).toHaveValue('');
  await expect(page.locator('[data-tour="jsonpath-empty"]')).toHaveCount(0);

  const recursiveExample = page.getByRole('button', { name: /递归搜索/ });
  await expect(recursiveExample).toHaveAttribute('title', '$..name\n点击填入并查询');
  await expect(recursiveExample).toHaveAttribute('aria-label', '填入并查询示例：递归搜索（$..name）');
  await recursiveExample.click();
  await expect(queryInput).toHaveValue('$..name');
  await expect(page.locator('[data-tour="jsonpath-empty"]')).toBeHidden();
  await expect(page.getByText('1 / 2')).toBeVisible();
  await expect(page.locator('#jsonpath-result-status')).toHaveAttribute('role', 'status');
  await expect(page.locator('#jsonpath-result-status')).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('#jsonpath-result-status')).toHaveAttribute('aria-atomic', 'true');
  await expect(queryInput).toHaveAttribute('aria-describedby', 'jsonpath-result-status');
  await expect(resultPreview).toContainText('Ada');
  await expect(resultPreview).toContainText('Bob');

  const actionCmdPreset = page.locator('[data-tour="jsonpath-response-preset"]').filter({ hasText: 'action_cmd' });
  await expect(page.locator('[data-tour="jsonpath-response-presets"]')).toContainText('Response 常用');
  await expect(page.locator('[data-tour="jsonpath-response-presets"]')).toContainText('traceId');
  await expect(actionCmdPreset).toHaveAttribute('title', '$..action_cmd\n点击填入并查询');
  await expect(actionCmdPreset).toHaveAttribute('aria-label', '填入并查询 Response 常用：action_cmd（$..action_cmd）');
  await actionCmdPreset.click();
  await expect(queryInput).toHaveValue('$..action_cmd');
  await expect(page.getByText('1 / 1')).toBeVisible();
  await expect(resultPreview).toContainText('$.meta.action_cmd');
  await expect(resultPreview).toContainText('对象(1)');

  await queryInput.fill('traceId');
  await queryButton.click();
  await expect(queryInput).toHaveValue('$..traceId');
  await expect(page.getByText('1 / 1')).toBeVisible();
  await expect(resultPreview).toContainText('trace-jsonpath-1');

  await queryInput.fill('trace.id');
  await queryButton.click();
  await expect(queryInput).toHaveValue('$..["trace.id"]');
  await expect(page.getByText('1 / 1')).toBeVisible();
  await expect(resultPreview).toContainText('trace-dot-1');

  await queryInput.fill('$.users[*].name');
  await queryButton.click();

  await expect(page.locator('[data-tour="jsonpath-empty"]')).toBeHidden();
  await expect(page.getByText('1 / 2')).toBeVisible();
  await expect(page.locator('.jsonpath-highlight').first()).toBeVisible();
  await expect(resultPreview).toContainText('Ada');
  await expect(resultPreview).toContainText('Bob');
  const secondResultPreview = resultPreview.locator('[data-tour="jsonpath-result-preview"]').nth(1);
  await expect(secondResultPreview).toHaveAttribute('aria-label', '定位第 2 个 JSONPath 结果：$.users[1].name');
  await secondResultPreview.click();
  await expect(page.getByText('2 / 2')).toBeVisible();
  const secondStructureButton = resultPreview.getByRole('button', { name: '在结构导航中定位第 2 个 JSONPath 结果：$.users[1].name' });
  await expect(secondStructureButton).toHaveAttribute('title', '在结构导航中定位 $.users[1].name');
  await secondStructureButton.click();
  await expect(page.getByText('已定位结构导航')).toBeVisible();
  const structurePanelFromJsonPath = page.getByRole('dialog', { name: 'JSON 结构导航' });
  await expect(structurePanelFromJsonPath).toBeVisible();
  await expect(structurePanelFromJsonPath).toContainText('$.users[1].name');
  await expect(structurePanelFromJsonPath).toContainText('/users/1/name');
  await structurePanelFromJsonPath.getByRole('button', { name: '关闭 JSON 结构导航' }).click();
  await expect(structurePanelFromJsonPath).toBeHidden();
  const previousResultButton = page.getByRole('button', { name: '上一个结果 (Shift+Enter)' });
  const nextResultButton = page.getByRole('button', { name: '下一个结果 (Enter)' });
  await expect(previousResultButton).toHaveAttribute('title', '上一个结果 (Shift+Enter)');
  await expect(nextResultButton).toHaveAttribute('title', '下一个结果 (Enter)');

  await previousResultButton.click();
  await expect(page.getByText('1 / 2')).toBeVisible();
  await nextResultButton.click();
  await expect(page.getByText('2 / 2')).toBeVisible();

  await page.getByRole('button', { name: '复制全部结果' }).click();
  await expect(page.getByText('查询结果已复制（2 项）')).toBeVisible();
  const copiedResult = await page.evaluate(() => window.localStorage.getItem('mock-clipboard'));
  expect(copiedResult).toBe(JSON.stringify(['Ada', 'Bob'], null, 2));

  await page.locator('[data-tour="jsonpath-copy-path-values"]').click();
  await expect(page.getByText('查询路径和值已复制（2 项）')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toBe('$.users[0].name = "Ada"\n$.users[1].name = "Bob"');

  await page.locator('[data-tour="jsonpath-favorite-toggle"]').click();
  await expect(page.locator('[data-tour="jsonpath-favorites"]')).toContainText('$.users[*].name');
  await expect(page.locator('[data-tour="jsonpath-favorite-item"]').filter({ hasText: '$.users[*].name' }))
    .toHaveAttribute('aria-label', '填入并查询收藏：$.users[*].name');
  const removeFavoriteButton = page.getByRole('button', { name: '移除收藏：$.users[*].name' });
  await removeFavoriteButton.focus();
  await expect(removeFavoriteButton).toHaveCSS('opacity', '1');

  await queryInput.fill('$.users[0].age');
  await page.locator('[data-tour="jsonpath-favorite-item"]').filter({ hasText: '$.users[*].name' }).click();
  await expect(queryInput).toHaveValue('$.users[*].name');
  await expect(page.getByText('1 / 2')).toBeVisible();

  await queryInput.fill('$.users[1].age');
  const historyItem = page.locator('[data-tour="jsonpath-history-item"]').filter({ hasText: '$.users[*].name' });
  await expect(historyItem).toHaveAttribute('aria-label', '填入并查询历史记录：$.users[*].name');
  await historyItem.click();
  await expect(queryInput).toHaveValue('$.users[*].name');
  await expect(page.getByText('1 / 2')).toBeVisible();
  const clearHistoryButton = page.locator('[data-tour="jsonpath-history"]').getByRole('button', { name: '清空 JSONPath 查询历史' });
  await expect(clearHistoryButton).toHaveAttribute('title', '清空 JSONPath 查询历史');
  const removeHistoryButton = page.getByRole('button', { name: '删除历史记录：$.users[*].name' });
  await removeHistoryButton.focus();
  await expect(removeHistoryButton).toHaveCSS('opacity', '1');

  await page.locator('[data-tour="jsonpath-panel"] button[title="关闭"]').click();
  await expect(page.locator('[data-tour="jsonpath-panel"]')).toBeHidden();
  await expect(page.locator('.jsonpath-highlight')).toHaveCount(0);
});

test('JSONPath 面板大查询处理中可取消', async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(window, '__jsonPathWorkerTerminateCount', {
      value: 0,
      writable: true,
      configurable: true,
    });

    class HangingWorker {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;

      postMessage() {
        // 保持挂起，用于验证取消查询会终止 Worker。
      }

      terminate() {
        (window as unknown as { __jsonPathWorkerTerminateCount: number }).__jsonPathWorkerTerminateCount += 1;
      }
    }

    Object.defineProperty(window, 'Worker', {
      configurable: true,
      value: HangingWorker,
    });
  });

  await fillSourceEditor(page, JSON.stringify({
    users: [
      { name: 'Ada', payload: { active: true } },
      { name: 'Bob', payload: { active: false } },
    ],
  }));

  await page.getByRole('button', { name: 'JSONPath 查询' }).click();
  await page.locator('[data-tour="jsonpath-input"]').fill('$..*');
  await page.locator('[data-tour="jsonpath-query-button"]').click();

  await expect(page.locator('[data-tour="jsonpath-cancel-query"]')).toBeVisible();
  await expect(page.locator('[data-tour="jsonpath-cancel-query"]')).toHaveAttribute('aria-label', '取消 JSONPath 查询，停止当前正在执行的查询');
  await expect(page.locator('[data-tour="jsonpath-query-status"]')).toHaveAttribute('role', 'status');
  await expect(page.locator('[data-tour="jsonpath-query-status"]')).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('[data-tour="jsonpath-query-status"]')).toHaveText('查询中...');
  await expect(page.locator('[data-tour="jsonpath-query-button"]')).toBeDisabled();
  await expect(page.locator('[data-tour="jsonpath-query-button"]')).toHaveAttribute('title', 'JSONPath 查询正在运行，可取消后重新查询');

  await page.locator('[data-tour="jsonpath-cancel-query"]').click();

  await expect(page.locator('[data-tour="jsonpath-query-status"]')).toHaveText('已取消查询');
  await expect(page.locator('[data-tour="jsonpath-cancel-query"]')).toHaveCount(0);
  await expect.poll(async () => page.evaluate(() => (
    (window as unknown as { __jsonPathWorkerTerminateCount: number }).__jsonPathWorkerTerminateCount
  ))).toBeGreaterThan(0);
});

test('JSONPath 面板可查询 JSON Lines 输入', async ({ page }) => {
  await fillSourceEditor(page, '{"level":"info","user":{"id":1}}\n  {"level":"error","user":{"id":2}}');

  await page.getByRole('button', { name: 'JSONPath 查询' }).click();
  await page.getByRole('button', { name: '查询', exact: true }).click();

  await expect(page.getByText('1 / 1')).toBeVisible();
  await expect(page.locator('.jsonpath-highlight').first()).toBeVisible();
  const resultPreview = page.locator('[data-tour="jsonpath-results"]');
  await expect(resultPreview).toContainText('$=数组(2)');

  await page.locator('[data-tour="jsonpath-input"]').fill('$[*].user.id');
  await page.getByRole('button', { name: '查询', exact: true }).click();

  await expect(page.getByText('1 / 2')).toBeVisible();
  await expect(resultPreview).toContainText('1');
  await expect(resultPreview).toContainText('2');
});

test('结构导航同名字段查询可覆盖 JSON Lines', async ({ page }) => {
  await fillSourceEditor(page, '{"level":"info","user":{"id":1}}\n{"level":"error","user":{"id":2}}');

  await page.locator('[data-tour="structure-nav-button"]').click();
  const structurePanel = page.getByRole('dialog', { name: 'JSON 结构导航' });
  await expect(structurePanel).toBeVisible();
  await structurePanel.locator('[data-tour="structure-nav-search"]').fill('user id');
  await structurePanel.getByTitle('选中并定位 $[0].user.id').click();

  const sameFieldButton = structurePanel.locator('[data-tour="structure-nav-query-same-field"]');
  await expect(sameFieldButton).toHaveAttribute('title', '用 $..id 查询全局同名字段');
  await sameFieldButton.click();

  const jsonPathPanel = page.getByRole('dialog', { name: 'JSONPath 查询' });
  await expect(jsonPathPanel).toBeVisible();
  await expect(jsonPathPanel.locator('[data-tour="jsonpath-input"]')).toHaveValue('$..id');
  await expect(page.getByText('1 / 2')).toBeVisible();
  const recursiveResultPreview = jsonPathPanel.locator('[data-tour="jsonpath-results"]');
  await expect(recursiveResultPreview).toContainText('$[0].user.id');
  await expect(recursiveResultPreview).toContainText('$[1].user.id');
});

test('Scheme 面板底部操作展示禁用原因', async ({ page }) => {
  await page.locator('[data-tour="scheme-button"]').click();

  const schemePanel = page.locator('[data-tour="scheme-panel"]');
  const qrCodeButton = schemePanel.locator('[data-tour="scheme-qrcode-button"]');
  const copyOriginalButton = schemePanel.locator('[data-tour="scheme-copy-original"]');
  const copyDecodedButton = schemePanel.locator('[data-tour="scheme-copy-decoded"]');

  await expect(qrCodeButton).toBeDisabled();
  await expect(qrCodeButton).toHaveAttribute('title', '请输入内容后生成二维码');
  await expect(qrCodeButton).toHaveAttribute('aria-label', '二维码，请输入内容后生成二维码');
  await expect(qrCodeButton).toHaveAttribute('aria-pressed', 'false');
  await expect(copyOriginalButton).toBeDisabled();
  await expect(copyOriginalButton).toHaveAttribute('title', '请输入待复制的原始值');
  await expect(copyOriginalButton).toHaveAttribute('aria-label', '复制原始值，请输入待复制的原始值');
  await expect(copyDecodedButton).toBeDisabled();
  await expect(copyDecodedButton).toHaveAttribute('title', '暂无解码结果可复制');
  await expect(copyDecodedButton).toHaveAttribute('aria-label', '复制解码结果，暂无解码结果可复制');

  await page.locator('[data-tour="scheme-standalone-input"]').fill('cmd=%7B%22nid%22%3A123%7D&from=feed');

  await expect(qrCodeButton).toBeEnabled();
  await expect(qrCodeButton).toHaveAttribute('title', '生成二维码');
  await expect(qrCodeButton).toHaveAttribute('aria-label', '二维码，生成二维码');
  await expect(copyOriginalButton).toHaveAttribute('title', '复制原始值到剪贴板');
  await expect(copyOriginalButton).toHaveAttribute('aria-label', '复制原始值，复制原始值到剪贴板');
  await expect(copyDecodedButton).toHaveAttribute('title', '复制解码结果到剪贴板');
  await expect(copyDecodedButton).toHaveAttribute('aria-label', '复制解码结果，复制解码结果到剪贴板');
  await expect(page.locator('[data-tour="scheme-copy-cmd-structure"]')).toHaveAttribute(
    'title',
    '复制为 cmdHandler 风格的 cmdSchema / cmdParams 结构'
  );
  await expect(page.locator('[data-tour="scheme-copy-cmd-structure"]')).toHaveAttribute(
    'aria-label',
    '复制 CMD 结构，复制为 cmdHandler 风格的 cmdSchema / cmdParams 结构'
  );
  await expect(page.locator('[data-tour="scheme-copy-path-values"]')).toHaveAttribute(
    'title',
    '复制解码 JSON 中的路径和值'
  );
  await expect(page.locator('[data-tour="scheme-copy-path-values"]')).toHaveAttribute(
    'aria-label',
    '复制路径和值，复制解码 JSON 中的路径和值'
  );

  await qrCodeButton.click();
  await expect(qrCodeButton).toHaveAttribute('title', '隐藏二维码');
  await expect(qrCodeButton).toHaveAttribute('aria-pressed', 'true');
  await expect(schemePanel.locator('[data-tour="scheme-qrcode-preview"] canvas[role="img"]')).toHaveCount(1);
});

test('Scheme 面板可展开 CMD 参数串', async ({ page }) => {
  const cmdPayload = encodeURIComponent(JSON.stringify({ nid: 123, title: '标题' }));

  await page.evaluate(() => {
    window.localStorage.setItem('scheme-panel-position', JSON.stringify({ x: 80, y: 80 }));
    window.localStorage.setItem('scheme-panel-size', JSON.stringify({ width: 450, height: 520 }));
  });
  await page.locator('[data-tour="scheme-button"]').click();
  await page.locator('[data-tour="scheme-standalone-input"]').fill(`cmd=${cmdPayload}&from=feed`);
  await expandSchemeDetails(page);

  const schemeResult = page.locator('[data-tour="scheme-result"] .view-lines');
  const qualitySummary = page.locator('[data-tour="scheme-quality-summary"]');
  await expect(qualitySummary).toContainText('解析完成');
  await expect(qualitySummary).toContainText('解码层 · 1');
  await expect(qualitySummary).toContainText('CMD字段 · 1');
  await qualitySummary.locator('[data-tour="scheme-copy-quality-summary"]').click();
  await expect(page.getByText(/已复制质量摘要（\d+ 字符 \/ [\d.]+ (?:B|KB|MB)）/)).toBeVisible();
  const copiedQualitySummary = await page.evaluate(() => window.localStorage.getItem('mock-clipboard') || '');
  expect(copiedQualitySummary).toContain('Scheme 解析质量摘要');
  expect(copiedQualitySummary).toContain('状态: 解析完成');
  expect(copiedQualitySummary).toContain('CMD字段: 1');
  expect(copiedQualitySummary).not.toContain('nid');
  await qualitySummary.locator('[data-tour="scheme-copy-quality-snapshot"]').click();
  await expect(page.getByText(/已复制质量快照（\d+ 字符 \/ [\d.]+ (?:B|KB|MB)）/)).toBeVisible();
  const copiedQualitySnapshot = await page.evaluate(() => window.localStorage.getItem('mock-clipboard') || '');
  const qualitySnapshotJson = JSON.parse(copiedQualitySnapshot) as {
    kind: string;
    safety: { containsRawValue: boolean };
    coverage: { score: number; level: string };
    totals: { records: number; decodeLayers: number; commandFields: number; nestedCommandFields: number };
    hotspots: { commandFields: string[] };
  };
  expect(qualitySnapshotJson.kind).toBe('json-helper-scheme-quality-snapshot');
  expect(qualitySnapshotJson.safety.containsRawValue).toBe(false);
  expect(qualitySnapshotJson.coverage).toMatchObject({ score: 100, level: 'success' });
  expect(qualitySnapshotJson.totals.records).toBe(1);
  expect(qualitySnapshotJson.totals.decodeLayers).toBe(1);
  expect(qualitySnapshotJson.totals.commandFields).toBe(1);
  expect(qualitySnapshotJson.totals.nestedCommandFields).toBe(1);
  expect(qualitySnapshotJson.hotspots.commandFields).toContain('cmd');
  expect(copiedQualitySnapshot).not.toContain('nid');
  expect(copiedQualitySnapshot).not.toContain('标题');
  await expect(page.getByText('CMD 参数递归解析')).toBeVisible();
  await expect(schemeResult).toContainText('"cmd"');
  await expect(schemeResult).toContainText('"nid": 123');
  await expect(schemeResult).toContainText('"title": "标题"');
  await expect(schemeResult).toContainText('"from": "feed"');
  await page.locator('[data-tour="scheme-copy-original"]').click();
  await expect(page.getByText(/已复制原始值（\d+ 字符 \/ [\d.]+ (?:B|KB|MB)）/)).toBeVisible();
  await page.locator('[data-tour="scheme-copy-decoded"]').click();
  await expect(page.getByText(/已复制解码结果（\d+ 字符 \/ [\d.]+ (?:B|KB|MB)）/)).toBeVisible();
  await page.locator('[data-tour="scheme-copy-path-values"]').click();
  await expect(page.getByText('已复制路径和值（3 项）')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toBe('$.cmd.nid = 123\n$.cmd.title = "标题"\n$.from = "feed"');

  await fillMonacoEditor(
    page,
    page.locator('[data-tour="scheme-result"] .monaco-editor').first(),
    '{"cmd":{"nid":456,"title":"标题"},"from":"feed"}'
  );
  const schemePanel = page.locator('[data-tour="scheme-panel"]');
  await expect(schemePanel.getByText('JSON 有效', { exact: true })).toBeVisible();
  await expectElementInside(page.locator('[data-tour="scheme-copy-serialized"]'), schemePanel);
  await expectElementInside(page.locator('[data-tour="scheme-apply-edit"]'), schemePanel);
  await expect(page.locator('[data-tour="scheme-copy-serialized"]')).toHaveAttribute('aria-label', '复制序列化结果，复制当前编辑内容重新编码后的结果');
  await expect(page.locator('[data-tour="scheme-apply-edit"]')).toHaveAttribute('aria-label', '应用修改，将当前编辑内容重新编码并应用回来源');
  await page.locator('[data-tour="scheme-copy-serialized"]').click();
  await expect(page.getByText(/已复制序列化结果（\d+ 字符 \/ [\d.]+ (?:B|KB|MB)）/)).toBeVisible();
  const serializedResult = await page.evaluate(() => window.localStorage.getItem('mock-clipboard'));
  expect(serializedResult).toContain('cmd=%7B%22nid%22%3A456');
  expect(serializedResult).toContain('from=feed');

  await fillMonacoEditor(page, page.locator('[data-tour="scheme-result"] .monaco-editor').first(), '{"cmd":');
  await expect(schemePanel.getByText('JSON 无效', { exact: true })).toBeVisible();
  await expect(qualitySummary).toContainText('JSON 异常');
  await expect(page.locator('[data-tour="scheme-json-edit-error"]')).toContainText('JSON 内容格式有误');
  await expect(page.locator('[data-tour="scheme-copy-serialized"]')).toHaveAttribute('title', '请先修正解码结果中的 JSON 错误');
  await expect(page.locator('[data-tour="scheme-copy-serialized"]')).toHaveAttribute('aria-label', '复制序列化结果，请先修正解码结果中的 JSON 错误');
  await expect(page.locator('[data-tour="scheme-apply-edit"]')).toHaveAttribute('title', '请先修正解码结果中的 JSON 错误');
  await expect(page.locator('[data-tour="scheme-apply-edit"]')).toHaveAttribute('aria-label', '应用修改，请先修正解码结果中的 JSON 错误');
});

test('Scheme 面板可用原始值替换 SOURCE 并打开深度解析报告', async ({ page }) => {
  const cmdPayload = encodeURIComponent(JSON.stringify({ nid: 123, title: '标题' }));
  const schemeInput = `cmd=${cmdPayload}&from=feed`;

  await fillSourceEditor(page, '{"existing":true}');
  await page.locator('[data-tour="scheme-button"]').click();
  await page.locator('[data-tour="scheme-standalone-input"]').fill(schemeInput);
  await expandSchemeDetails(page);

  const schemePanel = page.locator('[data-tour="scheme-panel"]');
  await schemePanel.locator('[data-tour="scheme-inspect-original"]').click();

  const confirmDialog = page.locator('[data-tour="confirm-dialog"]');
  await expect(confirmDialog).toContainText('用 Scheme 原始值排查');
  await expect(confirmDialog).toContainText('这会用 Scheme 面板原始值替换 SOURCE');
  await confirmDialog.getByRole('button', { name: '继续保留' }).click();
  await expect(confirmDialog).toHaveCount(0);
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('{"existing":true}');

  await schemePanel.locator('[data-tour="scheme-inspect-original"]').click();
  await page.locator('[data-tour="confirm-dialog"]').getByRole('button', { name: '替换并排查' }).click();

  await expect(page.getByText(/已用 Scheme 原始值替换 SOURCE 并开始排查/)).toBeVisible();
  await expect(schemePanel).toHaveCount(0);
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('cmd=');
  await expectPreviewText(page, '"cmd"');
  await expectPreviewText(page, '"nid": 123');
  await page.locator('[data-tour="transform-report-button"]').click();

  const reportPanel = page.locator('[data-tour="transform-report-panel"]');
  await expect(reportPanel).toBeVisible();
  await expect(reportPanel).toContainText('深度解析报告');
  await expect(reportPanel.locator('[data-tour="transform-report-cmd-count"]')).toContainText('CMD');
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
  await expandSchemeDetails(page);

  const placeholderSection = page.locator('[data-tour="scheme-runtime-placeholders"]');
  const qualitySummary = page.locator('[data-tour="scheme-quality-summary"]');
  await expect(qualitySummary).toContainText('结构可用');
  await expect(qualitySummary).toContainText('占位符 · 3');
  await expect(placeholderSection).toContainText('运行时占位符 · 3');
  const placeholderGroups = placeholderSection.locator('[data-tour="scheme-runtime-placeholder-groups"]');
  await expect(placeholderGroups).toContainText('__CONVERT_CMD__ ×2');
  await expect(placeholderGroups).toContainText('__WEBPANEL_CMD__ ×1');
  await expect(placeholderSection).toContainText('路径明细');
  await expect(placeholderSection).toContainText('$.cmd.first_cmd=__CONVERT_CMD__');
});

test('Scheme 面板可展开整段真实 Response 抽取链路', async ({ page }) => {
  const finalUrl = 'https://pro.m.jd.com/mall/active/page.html?sku=101&bd_vid=abc';
  const landingUrl = `https://union-click.jd.com/sem.php?source=sample-ads&unionId=262767352&to=${encodeURIComponent(finalUrl)}`;
  const webUrl = `sampleapp://v1/browser/open?url=${encodeURIComponent(landingUrl)}&adFlag=${encodeURIComponent(JSON.stringify({
    ext: '__AD_EXTRA_PARAM_ENCODE_1__',
    nid: 'ad1_101',
  }))}`;
  const appUrl = `openapp.jdmobile://virtual?params=${encodeURIComponent(JSON.stringify({
    category: 'jump',
    des: 'm',
    url: landingUrl,
  }))}`;
  const deeplinkCmd = `sampleapp://v7/vendor/ad/deeplink?params=${encodeURIComponent(JSON.stringify({
    appUrl,
    webUrl,
    source: 'feedna',
    extInfo: JSON.stringify({
      ext5: {
        protocal_header: 'openapp.jdmobile',
      },
    }),
  }))}`;
  const rewardButtonCmd = `samplevendor://vendor/ad/reward?task_params=${encodeURIComponent(JSON.stringify({
    android_pid: '1683310188080',
    task_id: '602',
    ext_params: {
      reward_num: '__REWARD_NUM__',
    },
  }))}`;
  const rewardDialog = `samplevendor://vendor/ad/rewardDialog?convert_btn=${encodeURIComponent(JSON.stringify({
    button_cmd: '__CONVERT_CMD__',
    button_text: '打开应用并体验',
  }))}&main_btn=${encodeURIComponent(JSON.stringify({
    button_cmd: rewardButtonCmd,
    button_text: '继续完成任务',
  }))}&convert_cmd=${encodeURIComponent(deeplinkCmd)}`;
  const panelScheme = `samplevendor://vendor/ad/rewardWebPanel?panel_cmd=${encodeURIComponent(deeplinkCmd)}&url=${encodeURIComponent(landingUrl)}&lp_real_url=${encodeURIComponent(landingUrl)}`;
  const rootScheme = `samplevendor://vendor/ad/rewardImpl?video_info=${encodeURIComponent(JSON.stringify({
    vid: '1353102586669',
    page_url: landingUrl,
    poster_image: 'https://feed-image.sample.com/0/pic/demo.jpg',
    tail_frame: {
      bottom_button_scheme: rewardButtonCmd,
      panel_scheme: panelScheme,
      user_portrait: 'https://feed-image.sample.com/0/pic/avatar.jpg',
    },
  }))}&reward=${encodeURIComponent(JSON.stringify({
    scheme: 'openapp.jdmobile://',
    stay_cmd: rewardDialog,
    reward_cmd: rewardDialog,
  }))}&convert=${encodeURIComponent(JSON.stringify({
    button_scheme: deeplinkCmd,
  }))}&panel=${encodeURIComponent(JSON.stringify({
    panel_cmd: deeplinkCmd,
    webpanel_cmd: deeplinkCmd,
  }))}&rotation_component=${encodeURIComponent(JSON.stringify({
    click_event_cmd: '__CONVERT_CMD__',
    webpanel_event_cmd: '__WEBPANEL_CMD__',
  }))}`;
  const extraParam = `AFD8f${encodeBase64(JSON.stringify({
    meg_name: 'AI',
    ad_extend: JSON.stringify({
      ad_info: {
        h_ecpm: 207000,
      },
      bid: 138,
    }),
  }))}`;
  const response = JSON.stringify({
    errno: 0,
    errmsg: '',
    data: {
      video: [{
        material: [{
          info: [{
            ad_common: {
              ad_style: 'reward_video_lp',
              scheme: rootScheme,
            },
          }],
        }],
        extra: [{
          k: 'extraParam',
          v: extraParam,
        }],
      }],
    },
  });

  await page.evaluate(() => {
    window.localStorage.setItem('scheme-panel-position', JSON.stringify({ x: 80, y: 80 }));
    window.localStorage.setItem('scheme-panel-size', JSON.stringify({ width: 560, height: 620 }));
  });
  await page.locator('[data-tour="scheme-button"]').click();
  await page.locator('[data-tour="scheme-standalone-input"]').fill(response);
  await expandSchemeDetails(page);

  await page.locator('[data-tour="scheme-copy-decoded"]').click();
  const decodedResult = await page.evaluate(() => window.localStorage.getItem('mock-clipboard') || '');
  expect(decodedResult).toContain('"panel_scheme"');
  expect(decodedResult).toContain('"panel_cmd"');
  expect(decodedResult).toContain('"appUrl"');
  expect(decodedResult).toContain('"sku": "101"');
  expect(decodedResult).toContain('"bd_vid": "abc"');
  expect(decodedResult).toContain('"h_ecpm": 207000');

  const commandSummary = page.locator('[data-tour="scheme-command-summary"]');
  await expect(commandSummary).toContainText('CMD 结构');
  await expect(commandSummary).toContainText('cmd解析');
  await expect(commandSummary.locator('[data-tour="scheme-command-schema-count"]')).toContainText('Schema');
  const topCommandSchemas = commandSummary.locator('[data-tour="scheme-top-command-schemas"]');
  await expect(topCommandSchemas).toContainText('samplevendor://vendor/ad/rewardImpl');
  await expect(topCommandSchemas).toContainText('sampleapp://v7/vendor/ad/deeplink');

  await page.locator('[data-tour="scheme-copy-cmd-structure"]').click();
  await expect(page.getByText('已复制 CMD 结构')).toBeVisible();
  const copiedCmdStructure = JSON.parse(
    await page.evaluate(() => window.localStorage.getItem('mock-clipboard') || '{}')
  );
  expect(copiedCmdStructure).toMatchObject({
    result: {
      cmdSchema: 'samplevendor://vendor/ad/rewardImpl',
      cmdParams: {
        video_info: {
          tail_frame: {
            panel_scheme: {
              cmdSchema: 'samplevendor://vendor/ad/rewardWebPanel',
            },
          },
        },
      },
      source: rootScheme,
    },
  });
  expect(copiedCmdStructure.result.cmdParams.errno).toBeUndefined();
  expect(copiedCmdStructure.result.cmdParams.data).toBeUndefined();

  const placeholderSection = page.locator('[data-tour="scheme-runtime-placeholders"]');
  await expect(placeholderSection).toContainText('__CONVERT_CMD__');
  await expect(placeholderSection).toContainText('__AD_EXTRA_PARAM_ENCODE_1__');
});

test('Scheme 面板整段 Response 超长字段展示性能保护提示', async ({ page }) => {
  const hugeCommand = `url=${encodeURIComponent(`https://example.com/landing?payload=${'x'.repeat(260_000)}`)}`;
  const response = JSON.stringify({
    errno: 0,
    data: {
      huge_cmd: hugeCommand,
      small_cmd: 'cmd=%7B%22ok%22%3Atrue%7D',
    },
  });

  await page.locator('[data-tour="scheme-button"]').click();
  await page.locator('[data-tour="scheme-standalone-input"]').fill(response);
  await expandSchemeDetails(page);

  const warnings = page.locator('[data-tour="scheme-decode-warnings"]');
  const qualitySummary = page.locator('[data-tour="scheme-quality-summary"]');
  await expect(qualitySummary).toContainText('部分跳过');
  await expect(qualitySummary).toContainText('跳过 · 1');
  await expect(warnings).toContainText('性能保护');
  await expect(warnings).toContainText('跳过 1');
  await expect(warnings).toContainText('$.data.huge_cmd');
  const commandSummary = page.locator('[data-tour="scheme-command-summary"]');
  await expect(commandSummary).toContainText('CMD 结构');
  await expect(commandSummary).toContainText('small_cmd');
  await page.locator('[data-tour="scheme-copy-decoded"]').click();
  const decodedResult = await page.evaluate(() => window.localStorage.getItem('mock-clipboard') || '');
  expect(decodedResult).toContain('"ok": true');
});

test('Scheme 面板大 Response 关闭或取消时会终止后台线程', async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(window, '__schemeWorkerTerminateCount', {
      value: 0,
      writable: true,
      configurable: true,
    });

    class HangingWorker {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;

      postMessage() {
        // 保持挂起，用于验证取消解析会终止 Worker。
      }

      terminate() {
        (window as unknown as { __schemeWorkerTerminateCount: number }).__schemeWorkerTerminateCount += 1;
      }
    }

    Object.defineProperty(window, 'Worker', {
      configurable: true,
      value: HangingWorker,
    });
  });

  await page.locator('[data-tour="scheme-button"]').click();
  await page.locator('[data-tour="scheme-standalone-input"]').fill(`cmd=${'x'.repeat(55_000)}`);

  await expect(page.locator('[data-tour="scheme-cancel-decode"]')).toBeVisible();
  await expect(page.locator('[data-tour="scheme-decode-status"]')).toHaveText('解析中...');

  await page.locator('[data-tour="scheme-close-button"]').click();
  await expect(page.locator('[data-tour="scheme-panel"]')).toHaveCount(0);
  await expect.poll(async () => page.evaluate(() => (
    (window as unknown as { __schemeWorkerTerminateCount: number }).__schemeWorkerTerminateCount
  ))).toBeGreaterThan(0);
  const terminateCountAfterClose = await page.evaluate(() => (
    (window as unknown as { __schemeWorkerTerminateCount: number }).__schemeWorkerTerminateCount
  ));

  await page.locator('[data-tour="scheme-button"]').click();
  await expect(page.locator('[data-tour="scheme-cancel-decode"]')).toBeVisible();
  await expect(page.locator('[data-tour="scheme-decode-status"]')).toHaveText('解析中...');
  await page.locator('[data-tour="scheme-cancel-decode"]').click();

  await expect(page.locator('[data-tour="scheme-decode-status"]')).toHaveText('已取消解析');
  await expect(page.locator('[data-tour="scheme-cancel-decode"]')).toHaveCount(0);
  await expect.poll(async () => page.evaluate(() => (
    (window as unknown as { __schemeWorkerTerminateCount: number }).__schemeWorkerTerminateCount
  ))).toBeGreaterThan(terminateCountAfterClose);

  await page.locator('[data-tour="scheme-close-button"]').click();
  await expect(page.locator('[data-tour="scheme-panel"]')).toHaveCount(0);
  await page.locator('[data-tour="scheme-button"]').click();
  await expect(page.locator('[data-tour="scheme-cancel-decode"]')).toBeVisible();
  await expect(page.locator('[data-tour="scheme-decode-status"]')).toHaveText('解析中...');
  await page.locator('[data-tour="scheme-close-button"]').click();
  await expect(page.locator('[data-tour="scheme-panel"]')).toHaveCount(0);
});

test('Scheme 面板可复制特殊 key 来源路径', async ({ page }) => {
  const nestedScheme = 'sampleapp://v1/browser/open?url=https%3A%2F%2Fexample.com%2Fpath%3Ffrom%3Dkey';

  await fillSourceEditor(page, JSON.stringify({
    'a.b': {
      'x/y': {
        'tilde~key': nestedScheme,
      },
    },
  }));
  await page.getByRole('button', { name: '格式化' }).click();
  await expectPreviewText(page, `"tilde~key": "${nestedScheme}"`);

  await page.locator('[data-tour="preview-editor"] .scheme-inline-highlight').first().click();
  const schemePanel = page.locator('[data-tour="scheme-panel"]');
  await expect(schemePanel).toContainText('Scheme 解析');
  await expect(page.locator('[data-tour="scheme-source-path"]')).toContainText('$["a.b"]["x/y"]["tilde~key"]');

  await page.locator('[data-tour="scheme-copy-path"]').click();
  await expect(page.getByText('已复制路径')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toBe('$["a.b"]["x/y"]["tilde~key"]');
});

test('SOURCE 编辑器可只读打开内嵌 Scheme', async ({ page }) => {
  const scheme = 'sampleapp://v1/browser/open?url=https%3A%2F%2Fexample.com%2Fpage&source=feed';

  await fillSourceEditor(page, JSON.stringify({ scheme }));

  const sourceEditor = page.locator('[data-tour="source-editor"]');
  const schemeHighlight = sourceEditor.locator('.scheme-inline-highlight').first();
  await expect(schemeHighlight).toBeVisible({ timeout: 15_000 });
  await expect(sourceEditor.locator('[data-tour="editor-scheme-count"]')).toHaveText('Scheme 1', { timeout: 15_000 });

  await schemeHighlight.click({ force: true });

  const schemePanel = page.locator('[data-tour="scheme-panel"]');
  await expect(schemePanel).toContainText('Scheme 解析');
  await expect(schemePanel.locator('[data-tour="scheme-source-path"]')).toContainText('$.scheme');
  await expect(schemePanel.locator('[data-tour="scheme-copy-original"]')).toBeVisible();
  await expect(schemePanel.locator('[data-tour="scheme-apply-edit"]')).toHaveCount(0);
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

  const schemeResult = page.locator('[data-tour="scheme-result"] .view-lines');
  await expect(schemeResult).toContainText('"__url__": "https://example.com/page"');
  await page.locator('[data-tour="scheme-copy-decoded"]').click();
  const copiedDecodedResult = await page.evaluate(() => window.localStorage.getItem('mock-clipboard'));
  expect(JSON.parse(copiedDecodedResult || '')).toEqual({
    __url__: 'https://example.com/page',
    from: 'feed',
    _hash: {
      cmd: {
        nid: 123,
      },
    },
  });

  await expandSchemeDetails(page);

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

  await page.locator('[data-tour="scheme-copy-cmd-structure"]').click();
  await expect(page.getByText('已复制 CMD 结构')).toBeVisible();
  const copiedCmdStructure = await page.evaluate(() => window.localStorage.getItem('mock-clipboard'));
  expect(JSON.parse(copiedCmdStructure || '')).toEqual({
    result: {
      cmdSchema: 'https://example.com/page',
      cmdParams: {
        from: 'feed',
        _hash: {
          cmd: {
            nid: 123,
          },
        },
      },
      source: `https://example.com/page?from=feed#/detail?cmd=${cmdPayload}`,
    },
  });
});

test('Scheme 面板展示内部 Base64 后缀摘要', async ({ page }) => {
  const suffix = 'UxMJm9zPTImaXA9MTI3LjAuMC4x';
  const encoded = `AFD8f${encodeBase64('{"meg_name":"AI","flag":true}')}${suffix}`;

  await page.locator('[data-tour="scheme-button"]').click();
  await page.locator('[data-tour="scheme-standalone-input"]').fill(encoded);
  await expandSchemeDetails(page);

  const base64Meta = page.locator('[data-tour="scheme-base64-meta"]');
  await expect(base64Meta).toContainText('内部 Base64');
  await expect(base64Meta).toContainText('头部=AFD8f');
  await expect(base64Meta).toContainText('跳过=UxM');
  await expect(base64Meta).toContainText('os=2');
  await expect(base64Meta).toContainText('ip=127.0.0.1');
});

test('智能修复调用 AI 时按钮展示禁用原因', async ({ page }) => {
  await page.unroute('**/mock-ai/chat/completions');
  let releaseResponse: () => void = () => undefined;
  const responseGate = new Promise<void>(resolve => {
    releaseResponse = resolve;
  });

  await page.route('**/mock-ai/chat/completions', async route => {
    await responseGate;
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

  await fillSourceEditor(page, '{items:[1,2], ok:}');
  const aiFixButton = page.locator('[data-tour="ai-fix"]');

  await expect(aiFixButton).toHaveAttribute('title', '智能修复');
  await aiFixButton.click();
  await expect(aiFixButton).toBeDisabled();
  await expect(aiFixButton).toHaveAttribute('aria-label', '智能修复中，请等待当前任务完成');
  await expect(aiFixButton).toHaveAttribute('title', '智能修复中，请等待当前任务完成');

  releaseResponse();
  await expect(page.getByText('智能修复摘要')).toBeVisible();
  await expect(page.getByText('AI 模型修复')).toBeVisible();
  await expect(aiFixButton).toBeEnabled();
});

test('智能修复可通过 AI 写回有效 JSON 并展示摘要', async ({ page }) => {
  await fillSourceEditor(page, '{items:[1,2], ok:}');

  await page.locator('[data-tour="ai-fix"]').click();

  await expect(page.getByText('智能修复摘要')).toBeVisible();
  await expect(page.getByText('AI 模型修复')).toBeVisible();
  await expectPreviewText(page, '"items": [');
  await expectPreviewText(page, '"ok": true');

  await page.getByRole('button', { name: '复制智能修复摘要' }).click();
  await expect(page.getByText(/已复制智能修复摘要（\d+ 字符 \/ [\d.]+ (?:B|KB|MB)）/)).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard')))
    .toContain('智能修复摘要');
});

test('SOURCE 错误条可直接触发智能修复', async ({ page }) => {
  await fillSourceEditor(page, '{items:[1,2], ok:}');

  const quickFixButton = page.locator('[data-tour="source-error-ai-fix"]');
  await expect(quickFixButton).toBeVisible();
  await expect(quickFixButton).toHaveAttribute('aria-label', '用智能修复当前 SOURCE JSON 错误');

  await quickFixButton.click();

  await expect(page.getByText('智能修复摘要')).toBeVisible();
  await expectPreviewText(page, '"items": [');
  await expectPreviewText(page, '"ok": true');
  await expect(quickFixButton).toHaveCount(0);
});

test('智能修复可先本地修复常见小错误', async ({ page }) => {
  await fillSourceEditor(page, "{items:[1,2,], ok:true, name:'json'}");

  await page.locator('[data-tour="ai-fix"]').click();

  await expect(page.getByText('智能修复摘要')).toBeVisible();
  await expect(page.getByText('本地规则修复')).toBeVisible();
  await expect(page.getByText('修正非标准 JSON 语法')).toBeVisible();
  await expectPreviewText(page, '"items": [');
  await expectPreviewText(page, '"name": "json"');
});

test('智能修复会同步打开文件的未保存状态', async ({ page }) => {
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.locator('[data-tour="open-file-button"]').click();
  const fileChooser = await fileChooserPromise;

  await fileChooser.setFiles({
    name: 'broken-ai.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{items:[1,2], ok:}'),
  });

  await expect(page.getByText('broken-ai.json').first()).toBeVisible();
  await expect(page.locator('[data-tour="save-status"]')).toHaveText('未保存标签');

  await page.locator('[data-tour="ai-fix"]').click();

  await expect(page.getByText('智能修复摘要')).toBeVisible();
  await expect(page.locator('[data-tour="save-status"]')).toHaveText('未保存');
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"ok":true');
});

test('智能修复空输入会提示用户', async ({ page }) => {
  await page.locator('[data-tour="ai-fix"]').click();

  await expect(page.getByText('请先输入需要修复的 JSON 内容')).toBeVisible();
});

test('智能修复本地可修敏感字段时不阻止写回', async ({ page }) => {
  await fillSourceEditor(page, '{token:"real-token", ok:true}');

  await page.locator('[data-tour="ai-fix"]').click();

  await expect(page.getByText('智能修复摘要')).toBeVisible();
  await expect(page.getByText('本地规则修复')).toBeVisible();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"token":"real-token"');
});

test('智能修复本地不可修敏感字段时阻止发送原文', async ({ page }) => {
  await fillSourceEditor(page, '{token:}');

  await page.locator('[data-tour="ai-fix"]').click();

  await expect(page.getByText('AI 修复默认不会发送原文')).toBeVisible();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('{token:}');
});

test('智能修复缺少 Key 会引导到配置页', async ({ page }) => {
  await page.locator('[data-tour="settings"]').click();
  await page.getByRole('tab', { name: 'AI 配置' }).click();
  await page.locator('input[type="password"]').fill('');
  await page.getByRole('button', { name: '保存设置' }).click();

  await fillSourceEditor(page, '{items:[1,2], ok:}');
  await page.locator('[data-tour="ai-fix"]').click();

  await expect(page.getByText('请先配置 AI API Key')).toBeVisible();
  await expect(page.getByText('AI 提供商')).toBeVisible();
  await expect(page.getByRole('button', { name: '保存设置' })).toBeVisible();
});

test('AI 配置可测试连接', async ({ page }) => {
  await page.unroute('**/mock-ai/chat/completions');
  let releaseResponse: () => void = () => undefined;
  const responseGate = new Promise<void>(resolve => {
    releaseResponse = resolve;
  });

  await page.route('**/mock-ai/chat/completions', async route => {
    await responseGate;
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
  });

  await page.locator('[data-tour="settings"]').click();
  await page.getByRole('tab', { name: 'AI 配置' }).click();

  const testConnectionButton = page.locator('[data-tour="ai-test-connection"]');
  await expect(testConnectionButton).toHaveAttribute('title', '测试当前 AI 配置是否可用');

  await testConnectionButton.click();
  await expect(testConnectionButton).toBeDisabled();
  await expect(testConnectionButton).toHaveAttribute('aria-label', 'AI 连接测试中，请稍候');
  await expect(testConnectionButton).toHaveAttribute('title', 'AI 连接测试中，请稍候');

  releaseResponse();
  await expect(page.getByText('连接测试通过')).toBeVisible();
  await expect(testConnectionButton).toBeEnabled();
  await expect(testConnectionButton).toHaveAttribute('title', '测试当前 AI 配置是否可用');

  await page.locator('input[type="password"]').fill('changed-key');
  await expect(page.getByText('连接测试通过')).toHaveCount(0);
});

test('自定义 AI 配置缺少 Base URL 时阻止保存', async ({ page }) => {
  await page.locator('[data-tour="settings"]').click();
  await page.getByRole('tab', { name: 'AI 配置' }).click();

  await page.locator('select').selectOption('custom');
  await page.locator('input[type="text"]').nth(1).fill('');
  await page.getByRole('button', { name: '保存设置' }).click();

  await expect(page.getByText('自定义 AI 提供商需要填写 Base URL')).toBeVisible();
  await expect(page.getByRole('button', { name: '保存设置' })).toBeVisible();

  const aiConfig = await page.evaluate(() => JSON.parse(window.localStorage.getItem('json-helper-ai-config') || '{}') as {
    baseUrl?: string;
  });
  expect(aiConfig.baseUrl).toBe(`${new URL(page.url()).origin}/mock-ai`);
});

test('模板填充会提前提示 SOURCE 前置条件', async ({ page }) => {
  await page.locator('[data-tour="template-fill-button"]').click();
  await expect(page.locator('[data-tour="template-clear-button"]')).toHaveAttribute('title', '模板为空，暂无内容可清空');
  await expect(page.locator('[data-tour="template-clear-button"]')).toHaveAttribute('aria-label', '清空模板，模板为空，暂无内容可清空');
  await expect(page.locator('[data-tour="template-format-button"]')).toHaveAttribute('title', '模板为空，暂无内容可格式化');
  await expect(page.locator('[data-tour="template-format-button"]')).toHaveAttribute('aria-label', '格式化模板，模板为空，暂无内容可格式化');
  await fillMonacoEditor(
    page,
    page.locator('[data-tour="template-fill-panel"] .monaco-editor').first(),
    '{"name":"new"}'
  );

  await expect(page.getByText('请先在 SOURCE 输入合法 JSON')).toBeVisible();
  await expect(page.locator('[data-tour="template-apply-button"]')).toBeDisabled();
  await expect(page.locator('[data-tour="template-apply-button"]')).toHaveAttribute('title', '请先在 SOURCE 输入合法 JSON');
  await expect(page.locator('[data-tour="template-apply-button"]')).toHaveAttribute('aria-label', '应用模板到当前 JSON，请先在 SOURCE 输入合法 JSON');
});

test('模板填充可格式化模板并应用', async ({ page }) => {
  await fillSourceEditor(page, '{"name":"old","keep":true}');

  await page.locator('[data-tour="template-fill-button"]').click();
  await fillMonacoEditor(
    page,
    page.locator('[data-tour="template-fill-panel"] .monaco-editor').first(),
    '{"name":"new","extra":{"enabled":true}}'
  );

  await expect(page.locator('[data-tour="template-format-button"]')).toHaveAttribute('title', '格式化模板 JSON');
  await expect(page.locator('[data-tour="template-format-button"]')).toHaveAttribute('aria-label', '格式化模板，格式化模板 JSON');
  await page.locator('[data-tour="template-format-button"]').click();
  await expect(page.getByText(/模板已格式化（\d+ 字符 \/ [\d.]+ (?:B|KB|MB)）/)).toBeVisible();
  await expect(page.locator('[data-tour="template-fill-panel"] .view-lines')).toContainText('"extra": {');

  await expect(page.locator('[data-tour="template-apply-button"]')).toHaveAttribute('title', '应用模板到 SOURCE');
  await expect(page.locator('[data-tour="template-apply-button"]')).toHaveAttribute('aria-label', '应用模板到当前 JSON，应用模板到 SOURCE');
  await page.locator('[data-tour="template-apply-button"]').click();
  await expect(page.getByText('模板已应用')).toBeVisible();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"name": "new"');
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"keep": true');
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"enabled": true');

  await expect(page.locator('[data-tour="template-clear-button"]')).toHaveAttribute('aria-label', '清空模板，清空当前模板内容');
  await page.locator('[data-tour="template-clear-button"]').click();
  await expect(page.getByText('模板已清空')).toBeVisible();
});

test('自动保存按钮展示开关语义和不可用原因', async ({ page }) => {
  const autoSave = page.locator('[data-tour="auto-save"]');

  await expect(autoSave).toHaveAttribute('aria-label', '自动保存不可用，请先打开文件以启用自动保存');
  await expect(autoSave).toHaveAttribute('aria-pressed', 'false');
  await expect(autoSave).toHaveAttribute('title', '请先打开文件以启用自动保存');
  await autoSave.click();
  await expect(page.getByText('请先打开或保存文件后再启用自动保存')).toBeVisible();

  await page.evaluate(() => {
    const handle = {
      name: 'auto-save.json',
      kind: 'file',
      getFile: async () => new File(['{"autoSave":true}'], 'auto-save.json', { type: 'application/json' }),
      createWritable: async () => ({
        write: async () => undefined,
        close: async () => undefined,
      }),
    };

    Object.defineProperty(window, 'showOpenFilePicker', {
      value: async () => [handle],
      configurable: true,
    });
  });

  await page.locator('[data-tour="open-file-button"]').click();
  await expect(page.getByText('auto-save.json').first()).toBeVisible();
  await expect(autoSave).toHaveAttribute('aria-label', '自动保存已关闭，点击开启');
  await expect(autoSave).toHaveAttribute('aria-pressed', 'false');
  await expect(autoSave).toHaveAttribute('title', '点击开启自动保存');

  await autoSave.click();
  await expect(page.getByText('自动保存已开启')).toBeVisible();
  await expect(autoSave).toHaveAttribute('aria-label', '自动保存已开启，点击关闭');
  await expect(autoSave).toHaveAttribute('aria-pressed', 'true');
  await expect(autoSave).toHaveAttribute('title', '自动保存已开启');

  await autoSave.click();
  await expect(page.getByText('自动保存已关闭')).toBeVisible();
  await expect(autoSave).toHaveAttribute('aria-label', '自动保存已关闭，点击开启');
  await expect(autoSave).toHaveAttribute('aria-pressed', 'false');
});

test('文件标签支持键盘切换和关闭语义', async ({ page }) => {
  await fillSourceEditor(page, '{"first":true}');
  const newTabButton = page.getByRole('button', { name: '新建标签 (Cmd+N)' });
  await expect(newTabButton).toHaveAttribute('title', '新建标签 (Cmd+N)');
  await newTabButton.click();

  const tabList = page.getByRole('tablist', { name: '已打开文件标签' });
  const firstTab = tabList.getByRole('tab', { name: /Untitled-1/ });
  const secondTab = tabList.getByRole('tab', { name: /Untitled-2/ });

  await expect(firstTab).toHaveAttribute('aria-selected', 'false');
  await expect(firstTab).toHaveAttribute('aria-label', 'Untitled-1，未保存');
  await expect(secondTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('button', { name: '关闭未保存标签 Untitled-1' })).toHaveAttribute('title', '关闭未保存标签 Untitled-1');
  await expect(page.getByRole('button', { name: '关闭标签 Untitled-2' })).toHaveAttribute('title', '关闭标签 Untitled-2');

  await secondTab.press('ArrowLeft');
  await expect(firstTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"first":true');

  await firstTab.press('End');
  await expect(secondTab).toHaveAttribute('aria-selected', 'true');

  await secondTab.press('Delete');
  await expect(secondTab).toHaveCount(0);
  await expect(firstTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"first":true');

  await firstTab.press('Enter');
  await expect(firstTab).toHaveAttribute('aria-selected', 'true');
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
  await expect(page.getByText('已开始下载；浏览器无法确认文件是否已落盘，当前内容仍标记为未保存')).toBeVisible();
  await expect(page.getByRole('button', { name: '关闭未保存标签 sample.json' })).toBeVisible();
});

test('打开 HAR 文件会提取请求响应 body 为派生 JSON', async ({ page }) => {
  const har = {
    log: {
      entries: [
        {
          request: {
            method: 'GET',
            url: 'https://api.example.com/feed',
          },
          response: {
            status: 200,
            content: {
              mimeType: 'application/json',
              text: JSON.stringify({
                ok: true,
                cmd: 'sampleapp://v1/open?params=%7B%22id%22%3A1%7D',
              }),
            },
          },
        },
        {
          request: {
            method: 'GET',
            url: 'https://static.example.com/image.png',
          },
          response: {
            status: 200,
            content: {
              mimeType: 'image/png',
            },
          },
        },
      ],
    },
  };

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.locator('[data-tour="open-file-button"]').click();
  const fileChooser = await fileChooserPromise;

  await fileChooser.setFiles({
    name: 'network.har',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(har)),
  });

  await expect(page.getByText('network.har.payloads.json').first()).toBeVisible();
  await expect(page.getByText('已从 HAR 提取 1/2 条请求/响应 body')).toBeVisible();
  await expect(page.locator('[data-tour="deep-format-btn"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('HAR_PAYLOAD_EXPORT');
  await expect(page.getByRole('button', {
    name: '关闭未保存标签 network.har.payloads.json',
  })).toBeVisible();

  await page.locator('[data-tour="copy-source"]').click();
  const copiedSource = await page.evaluate(() => window.localStorage.getItem('mock-clipboard') || '');
  expect(JSON.parse(copiedSource)).toMatchObject({
    source: 'HAR_PAYLOAD_EXPORT',
    entryCount: 2,
    extractedEntryCount: 1,
    summary: {
      methods: { GET: 1 },
      statusCodes: { '200': 1 },
      hosts: { 'api.example.com': 1 },
      bodyKinds: { 'response:json': 1 },
    },
    entries: [
      {
        label: 'GET 200 api.example.com/feed',
        response: {
          body: {
            kind: 'json',
            value: {
              cmd: 'sampleapp://v1/open?params=%7B%22id%22%3A1%7D',
            },
          },
        },
      },
    ],
  });
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
  expect(consoleMessages.filter(message => message.includes('打开文件失败') || message.includes('读取文件失败'))).toEqual([]);
});

test('部分文件句柄读取失败时反馈原因并保留成功文件', async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(window, 'showOpenFilePicker', {
      configurable: true,
      value: async () => [
        {
          name: 'blocked.json',
          getFile: async () => {
            throw new Error('文件权限已失效');
          },
        },
        {
          name: 'opened.json',
          getFile: async () => new File(['{"opened":true}'], 'opened.json', {
            type: 'application/json',
          }),
        },
      ],
    });
  });

  await page.locator('[data-tour="open-file-button"]').click();

  await expect(page.getByText('打开文件失败：文件权限已失效')).toBeVisible();
  await expect(page.getByText('opened.json').first()).toBeVisible();
  await expect(page.locator('[data-tour="source-editor"] .view-lines')).toContainText('"opened":true');
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
  await ensureSourceEditorReady(page);
  const sourceEditor = page.locator('[data-tour="source-editor"] .monaco-editor').first();
  await fillMonacoEditor(page, sourceEditor, value);
};

const ensureSourceEditorReady = async (page: Page) => {
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await waitForEditorReady(page, '[data-tour="source-editor"]');
      return;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await gotoMainApp(page, `source-editor-${attempt}`);
        await waitForMainAppReady(page, { waitForSourceEditor: false, waitForPreviewEditor: false });
      }
    }
  }

  throw lastError;
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
  await waitForEditorReady(page, '[data-tour="preview-editor"]');
  await expect(page.locator('[data-tour="preview-editor"] .view-lines')).toContainText(text);
};

const expandSchemeDetails = async (page: Page) => {
  const expandButton = page
    .locator('[data-tour="scheme-panel"]')
    .getByRole('button', { name: '展开详情', exact: true });

  if (await expandButton.isVisible()) {
    await expandButton.click();
  }
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
