import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { FEATURE_TOUR_IDS, openMainApp } from '../e2e/helpers/appReady';

interface BrowserWorkerBudgetCase {
  name: string;
  durationMs: number;
  budgetMs: number;
  pass: boolean;
  details: string;
}

const BROWSER_WORKER_PERFORMANCE_BUDGET_KIND = 'json-helper-browser-worker-performance-budget';
const JSONPATH_CANCEL_BUDGET_MS = 1_500;
const SCHEME_CANCEL_BUDGET_MS = 1_500;
const SCHEME_CONTINUOUS_LARGE_RESPONSE_BUDGET_MS = 15_000;
const CLOSED_PANELS_LARGE_INPUT_SWITCH_BUDGET_MS = 8_000;

const budgetCases: BrowserWorkerBudgetCase[] = [];

const roundDuration = (durationMs: number): number => (
  Math.round(durationMs * 10) / 10
);

const recordBudgetCase = (
  name: string,
  durationMs: number,
  budgetMs: number,
  details: string
) => {
  const roundedDurationMs = roundDuration(durationMs);
  const budgetCase = {
    name,
    durationMs: roundedDurationMs,
    budgetMs,
    pass: roundedDurationMs <= budgetMs,
    details,
  };
  budgetCases.push(budgetCase);
  expect(roundedDurationMs, `${name} 耗时 ${roundedDurationMs}ms，预算 ${budgetMs}ms`).toBeLessThanOrEqual(budgetMs);
};

const getPerformanceReport = () => ({
  schemaVersion: 1,
  kind: BROWSER_WORKER_PERFORMANCE_BUDGET_KIND,
  generatedAt: new Date().toISOString(),
  summary: {
    pass: budgetCases.every(item => item.pass),
    caseCount: budgetCases.length,
    failed: budgetCases.filter(item => !item.pass).length,
  },
  cases: budgetCases,
});

const formatPerformanceMarkdown = (): string => {
  const report = getPerformanceReport();
  return [
    '# 浏览器 Worker 端到端性能预算',
    '',
    `- 结果: ${report.summary.pass ? '通过' : '失败'}`,
    `- Case: ${report.summary.caseCount}`,
    '',
    '| Case | Duration | Budget | Result | Details |',
    '| --- | ---: | ---: | --- | --- |',
    ...report.cases.map(item => (
      `| ${item.name} | ${item.durationMs}ms | ${item.budgetMs}ms | ${item.pass ? '通过' : '失败'} | ${item.details} |`
    )),
    '',
  ].join('\n');
};

const writeTextFile = async (filePath: string, content: string) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, 'utf-8');
};

const appendTextFile = async (filePath: string, content: string) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await appendFile(filePath, content, 'utf-8');
};

const fillMonacoEditor = async (page: Page, editor: Locator, value: string) => {
  const selectAllShortcut = `${process.platform === 'darwin' ? 'Meta' : 'Control'}+A`;
  await editor.click();
  await page.keyboard.press(selectAllShortcut);
  await page.keyboard.press(selectAllShortcut);
  await page.keyboard.press('Backspace');
  const isValueInjected = await editor.evaluate((node, text) => {
    type MonacoCodeEditor = {
      focus: () => void;
      getDomNode: () => HTMLElement | null;
      getValue: () => string;
      setValue: (newValue: string) => void;
    };

    const monacoApi = (window as unknown as {
      monaco?: {
        editor?: {
          getEditors?: () => readonly MonacoCodeEditor[];
        };
      };
    }).monaco;
    const targetEditor = monacoApi?.editor?.getEditors?.().find(item => {
      const editorNode = item.getDomNode();
      return editorNode === node || Boolean(editorNode?.contains(node)) || node.contains(editorNode);
    });

    if (!targetEditor) {
      return false;
    }

    targetEditor.setValue(text);
    targetEditor.focus();
    return targetEditor.getValue() === text;
  }, value);

  if (!isValueInjected) {
    await page.keyboard.insertText(value);
  }
};

const fillSourceEditor = async (page: Page, value: string) => {
  const sourceEditor = page.locator('[data-tour="source-editor"] .monaco-editor').first();
  await fillMonacoEditor(page, sourceEditor, value);
};

const expectSchemeDecodeComplete = async (page: Page) => {
  await expect(page.locator('[data-tour="scheme-decode-status"]')).toHaveText(/层解码|无需解码/, { timeout: 20_000 });
};

const installHangingWorker = async (page: Page, terminateCounterName: string) => {
  await page.evaluate((counterName) => {
    Object.defineProperty(window, counterName, {
      value: 0,
      writable: true,
      configurable: true,
    });

    class HangingWorker {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;

      postMessage() {
        // 保持挂起，用于量化取消操作从点击到 UI 恢复的耗时。
      }

      terminate() {
        const targetWindow = window as unknown as Record<string, number>;
        targetWindow[counterName] += 1;
      }
    }

    Object.defineProperty(window, 'Worker', {
      configurable: true,
      value: HangingWorker,
    });
  }, terminateCounterName);
};

const getTerminateCount = async (page: Page, terminateCounterName: string): Promise<number> => (
  page.evaluate((counterName) => (
    (window as unknown as Record<string, number>)[counterName] || 0
  ), terminateCounterName)
);

const buildLargeResponse = (marker: string, paddingSize = 70_000): string => {
  const landingUrl = `https://example.com/landing?sku=${marker}&bd_vid=${marker}`;
  const rootScheme = `baiduboxapp://v1/easybrowse/open?url=${encodeURIComponent(landingUrl)}&from=${marker}`;
  const response = {
    errno: 0,
    errmsg: '',
    data: {
      video: [{
        material: [{
          info: [{
            ad_common: {
              ad_style: 'perf_budget',
              scheme: rootScheme,
            },
          }],
        }],
      }],
    },
    _performance_padding: 'x'.repeat(paddingSize),
  };

  return JSON.stringify(response);
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/visitor/ping', async route => {
    await route.fulfill({ status: 204, body: '' });
  });

  await page.addInitScript((featureTourIds: string[]) => {
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
    featureTourIds.forEach(featureId => {
      window.localStorage.setItem(`json-helper-feature-tour-${featureId}`, 'completed');
    });
  }, FEATURE_TOUR_IDS);

  await openMainApp(page);
});

test.afterAll(async () => {
  const outputPath = process.env.BROWSER_WORKER_PERF_OUTPUT || 'test-results/browser-worker-performance-budget.json';
  const summaryPath = process.env.BROWSER_WORKER_PERF_SUMMARY;
  await writeTextFile(outputPath, `${JSON.stringify(getPerformanceReport(), null, 2)}\n`);
  if (summaryPath) {
    await appendTextFile(summaryPath, formatPerformanceMarkdown());
  }
});

test('JSONPath Worker 取消响应时间进入预算', async ({ page }) => {
  await installHangingWorker(page, '__jsonPathWorkerTerminateCount');
  await fillSourceEditor(page, JSON.stringify({
    items: Array.from({ length: 120 }, (_, index) => ({
      id: index,
      payload: { active: index % 2 === 0 },
    })),
  }));

  await page.locator('[data-tour="jsonpath-button"]').click();
  await page.locator('[data-tour="jsonpath-input"]').fill('$..*');
  await page.locator('[data-tour="jsonpath-query-button"]').click();
  await expect(page.locator('[data-tour="jsonpath-query-status"]')).toHaveText('查询中...');

  const startedAt = performance.now();
  await page.locator('[data-tour="jsonpath-cancel-query"]').click();
  await expect(page.locator('[data-tour="jsonpath-query-status"]')).toHaveText('已取消查询');
  await expect(page.locator('[data-tour="jsonpath-cancel-query"]')).toHaveCount(0);
  await expect.poll(() => getTerminateCount(page, '__jsonPathWorkerTerminateCount')).toBeGreaterThan(0);
  const durationMs = performance.now() - startedAt;

  recordBudgetCase(
    'jsonpath-cancel-response',
    durationMs,
    JSONPATH_CANCEL_BUDGET_MS,
    '挂起 Worker 后点击取消，等待状态恢复为已取消查询'
  );
});

test('Scheme Worker 取消响应时间进入预算', async ({ page }) => {
  await installHangingWorker(page, '__schemeWorkerTerminateCount');

  await page.locator('[data-tour="scheme-button"]').click();
  await page.locator('[data-tour="scheme-standalone-input"]').fill(`cmd=${'x'.repeat(55_000)}`);
  await expect(page.locator('[data-tour="scheme-decode-status"]')).toHaveText('解析中...');

  const startedAt = performance.now();
  await page.locator('[data-tour="scheme-cancel-decode"]').click();
  await expect(page.locator('[data-tour="scheme-decode-status"]')).toHaveText('已取消解析');
  await expect(page.locator('[data-tour="scheme-cancel-decode"]')).toHaveCount(0);
  await expect.poll(() => getTerminateCount(page, '__schemeWorkerTerminateCount')).toBeGreaterThan(0);
  const durationMs = performance.now() - startedAt;

  recordBudgetCase(
    'scheme-cancel-response',
    durationMs,
    SCHEME_CANCEL_BUDGET_MS,
    '挂起 Worker 后点击取消，等待状态恢复为已取消解析'
  );
});

test('Scheme Worker 连续大 response 解析进入预算', async ({ page }) => {
  await page.locator('[data-tour="scheme-button"]').click();
  const input = page.locator('[data-tour="scheme-standalone-input"]');
  const firstResponse = buildLargeResponse('perf-first');
  const secondResponse = buildLargeResponse('perf-second');

  const startedAt = performance.now();
  await input.fill(firstResponse);
  await expectSchemeDecodeComplete(page);
  await expect(page.locator('[data-tour="scheme-diagnostics-panel"]')).toContainText('CMD · 1', { timeout: 20_000 });
  await input.fill(secondResponse);
  await expectSchemeDecodeComplete(page);
  await page.locator('[data-tour="scheme-copy-decoded"]').click();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('mock-clipboard') || ''))
    .toContain('perf-second');
  const durationMs = performance.now() - startedAt;

  recordBudgetCase(
    'scheme-continuous-large-response',
    durationMs,
    SCHEME_CONTINUOUS_LARGE_RESPONSE_BUDGET_MS,
    `连续解析 ${firstResponse.length} / ${secondResponse.length} 字符 response 并确认第二次结果生效`
  );
});

test('已加载面板关闭后切换大输入进入预算', async ({ page }) => {
  const warmupResponse = buildLargeResponse('closed-panels-warmup', 25_000);
  const nextResponse = buildLargeResponse('closed-panels-next', 25_000);

  await fillSourceEditor(page, warmupResponse);

  await page.locator('[data-tour="jsonpath-button"]').click();
  await expect(page.locator('[data-tour="jsonpath-panel"]')).toBeVisible();
  await page.getByRole('button', { name: '关闭 JSONPath 查询' }).click();
  await expect(page.locator('[data-tour="jsonpath-panel"]')).toBeHidden();

  await page.locator('[data-tour="structure-nav-button"]').click();
  await expect(page.locator('[data-tour="structure-nav-panel"]')).toBeVisible();
  await page.getByRole('button', { name: '关闭 JSON 结构导航' }).click();
  await expect(page.locator('[data-tour="structure-nav-panel"]')).toBeHidden();

  await page.locator('[data-tour="deep-format-btn"]').click();
  await expect(page.locator('[data-tour="transform-report-button"]')).toBeVisible({ timeout: 20_000 });
  await page.locator('[data-tour="transform-report-button"]').click();
  await expect(page.locator('[data-tour="transform-report-panel"]')).toBeVisible();
  await page.getByRole('button', { name: '关闭 深度解析报告' }).click();
  await expect(page.locator('[data-tour="transform-report-panel"]')).toBeHidden();

  const startedAt = performance.now();
  await fillSourceEditor(page, nextResponse);
  await expect(page.locator('[data-tour="preview-editor"]')).toContainText('closed-panels-next', { timeout: 20_000 });
  const durationMs = performance.now() - startedAt;

  recordBudgetCase(
    'closed-panels-large-input-switch',
    durationMs,
    CLOSED_PANELS_LARGE_INPUT_SWITCH_BUDGET_MS,
    `JSONPath、结构导航、深度报告已加载并关闭后切换 ${nextResponse.length} 字符 response`
  );
});
