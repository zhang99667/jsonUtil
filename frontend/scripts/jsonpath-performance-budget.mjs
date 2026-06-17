#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';
import { buildCorpusResponseText } from './scheme-corpus-snapshot.mjs';
import { buildSizedResponseText, percentile } from './scheme-performance-budget.mjs';

export const JSONPATH_PERFORMANCE_BUDGET_KIND = 'json-helper-jsonpath-performance-budget';

export const DEFAULT_JSONPATH_PERFORMANCE_CASES = [
  {
    name: 'response-50kb-scheme-search',
    source: 'corpus-response',
    targetBytes: 50 * 1024,
    query: '$..scheme',
    resultLimit: 1000,
    maxDurationMs: 500,
    minResults: 2,
    minRanges: 2,
    expectLimited: false,
  },
  {
    name: 'response-250kb-scheme-search',
    source: 'corpus-response',
    targetBytes: 250 * 1024,
    query: '$..scheme',
    resultLimit: 1000,
    maxDurationMs: 1_500,
    minResults: 10,
    minRanges: 10,
    expectLimited: false,
  },
  {
    name: 'result-limit-8k-list',
    source: 'generated-list',
    itemCount: 8_000,
    query: '$.items[*].id',
    resultLimit: 1000,
    maxDurationMs: 2_000,
    minResults: 1000,
    minRanges: 1000,
    expectLimited: true,
  },
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(__dirname, '..');
const CORPUS_DIR = path.join(FRONTEND_ROOT, 'fixtures', 'scheme-corpus');

const parseJsonInput = (text, label) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    const detail = error instanceof SyntaxError ? error.message : String(error);
    throw new Error(`${label} 不是有效 JSON: ${detail}`);
  }
};

const byteLength = text => Buffer.byteLength(text, 'utf8');

const roundDuration = value => Math.round(value * 10) / 10;

export const buildGeneratedListSourceText = itemCount => {
  const normalizedCount = Math.max(1, Number(itemCount) || 1);
  return JSON.stringify({
    items: Array.from({ length: normalizedCount }, (_, index) => ({
      id: index + 1,
      name: `item-${index + 1}`,
      group: index % 10,
    })),
  });
};

const loadJsonPathModule = async () => {
  const imported = await runnerImport(
    path.join(FRONTEND_ROOT, 'src', 'utils', 'jsonPathQuery.ts'),
    {
      root: FRONTEND_ROOT,
      configFile: false,
      logLevel: 'error',
    }
  );

  return {
    queryJsonPathRanges: imported.module.queryJsonPathRanges,
  };
};

const loadCorpusFixture = async sampleFilter => {
  const filename = `${sampleFilter}.redacted.json`;
  const fixturePath = path.join(CORPUS_DIR, filename);
  return parseJsonInput(await readFile(fixturePath, 'utf8'), filename);
};

const buildCaseSourceText = ({ caseConfig, corpusResponseText }) => {
  if (caseConfig.source === 'generated-list') {
    return buildGeneratedListSourceText(caseConfig.itemCount);
  }

  return buildSizedResponseText(corpusResponseText, caseConfig.targetBytes);
};

const pushMinimumFailure = (failures, key, label, actual, expected) => {
  if (!Number.isFinite(expected) || actual >= expected) return;
  failures.push({
    key,
    actual,
    expected,
    message: `${label} ${actual} 低于下限 ${expected}`,
  });
};

const listFailures = ({ caseConfig, durationMs, queryResult }) => {
  const failures = [];
  if (durationMs > caseConfig.maxDurationMs) {
    failures.push({
      key: 'durationMs',
      actual: durationMs,
      expected: caseConfig.maxDurationMs,
      message: `耗时 ${durationMs}ms 超过预算 ${caseConfig.maxDurationMs}ms`,
    });
  }

  pushMinimumFailure(failures, 'results', '命中数', queryResult.totalResults, caseConfig.minResults);
  pushMinimumFailure(failures, 'ranges', '高亮范围', queryResult.ranges.length, caseConfig.minRanges);

  if (
    typeof caseConfig.expectLimited === 'boolean' &&
    queryResult.isLimited !== caseConfig.expectLimited
  ) {
    failures.push({
      key: 'isLimited',
      actual: queryResult.isLimited,
      expected: caseConfig.expectLimited,
      message: `截断状态 ${queryResult.isLimited} 不符合预期 ${caseConfig.expectLimited}`,
    });
  }

  return failures;
};

export const buildJsonPathPerformanceCaseResult = ({
  caseConfig,
  responseBytes,
  durations,
  queryResult,
}) => {
  const medianMs = roundDuration(percentile(durations, 0.5));
  const maxMs = roundDuration(Math.max(...durations));
  const failures = listFailures({
    caseConfig,
    durationMs: medianMs,
    queryResult,
  });

  return {
    name: caseConfig.name,
    source: caseConfig.source,
    query: caseConfig.query,
    responseBytes,
    iterations: durations.length,
    durationMs: {
      median: medianMs,
      max: maxMs,
      budget: caseConfig.maxDurationMs,
    },
    resultLimit: caseConfig.resultLimit,
    queryResult: {
      totalResults: queryResult.totalResults,
      rangeCount: queryResult.ranges.length,
      isLimited: queryResult.isLimited,
    },
    pass: failures.length === 0,
    failures,
  };
};

const runPerformanceCase = ({
  caseConfig,
  responseText,
  iterations,
  modules,
}) => {
  const durations = [];
  let queryResult;

  for (let index = 0; index < iterations; index += 1) {
    const start = performance.now();
    queryResult = modules.queryJsonPathRanges(responseText, caseConfig.query, {
      resultLimit: caseConfig.resultLimit,
    });
    durations.push(performance.now() - start);
  }

  return buildJsonPathPerformanceCaseResult({
    caseConfig,
    responseBytes: byteLength(responseText),
    durations,
    queryResult,
  });
};

export const buildJsonPathPerformanceBudget = async ({
  sampleFilter = 'reward-response',
  iterations = 3,
  cases = DEFAULT_JSONPATH_PERFORMANCE_CASES,
} = {}) => {
  const fixture = await loadCorpusFixture(sampleFilter);
  const corpusResponseText = buildCorpusResponseText(fixture);
  const modules = await loadJsonPathModule();
  const normalizedIterations = Math.max(1, Number(iterations) || 1);
  const results = cases.map(caseConfig => runPerformanceCase({
    caseConfig,
    responseText: buildCaseSourceText({
      caseConfig,
      corpusResponseText,
    }),
    iterations: normalizedIterations,
    modules,
  }));

  return {
    schemaVersion: 1,
    kind: JSONPATH_PERFORMANCE_BUDGET_KIND,
    generatedAt: new Date().toISOString(),
    sample: fixture.name || sampleFilter,
    iterations: normalizedIterations,
    summary: {
      pass: results.every(result => result.pass),
      caseCount: results.length,
      failed: results.filter(result => !result.pass).length,
    },
    cases: results,
  };
};

const formatMarkdownValue = value => String(value ?? '').replace(/\|/g, '\\|');

export const formatJsonPathPerformanceBudgetMarkdown = budget => {
  const lines = [
    '# JSONPath 性能预算',
    '',
    `- 样本: ${budget.sample}`,
    `- 轮次: ${budget.iterations}`,
    `- 结果: ${budget.summary.pass ? 'PASS' : 'FAIL'}`,
    '',
    '| Case | 来源 | Query | 大小 | Median | Max | 预算 | 命中 | 高亮 | 上限 | 截断 | 结果 |',
    '| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |',
  ];

  budget.cases.forEach(result => {
    lines.push([
      formatMarkdownValue(result.name),
      formatMarkdownValue(result.source),
      formatMarkdownValue(result.query),
      result.responseBytes,
      `${result.durationMs.median}ms`,
      `${result.durationMs.max}ms`,
      `${result.durationMs.budget}ms`,
      result.queryResult.totalResults,
      result.queryResult.rangeCount,
      result.resultLimit,
      result.queryResult.isLimited ? '是' : '否',
      result.pass ? 'PASS' : 'FAIL',
    ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
  });

  const failures = budget.cases.flatMap(result => (
    result.failures.map(failure => ({
      caseName: result.name,
      ...failure,
    }))
  ));
  if (failures.length > 0) {
    lines.push('', '## 失败项', '');
    failures.forEach(failure => {
      lines.push(`- ${formatMarkdownValue(failure.caseName)}.${failure.key}: ${failure.message}`);
    });
  }

  return `${lines.join('\n')}\n`;
};

export const parseCliArgs = argv => {
  const options = {
    sampleFilter: 'reward-response',
    iterations: 3,
    outputPath: undefined,
    summaryPath: undefined,
    strict: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--strict') {
      options.strict = true;
      continue;
    }

    if (arg === '--sample') {
      const value = argv[index + 1];
      if (!value) throw new Error('--sample 需要样本名');
      options.sampleFilter = value;
      index += 1;
      continue;
    }

    if (arg === '--iterations') {
      const value = Number(argv[index + 1]);
      if (!Number.isInteger(value) || value <= 0) throw new Error('--iterations 需要正整数');
      options.iterations = value;
      index += 1;
      continue;
    }

    if (arg === '--output') {
      const value = argv[index + 1];
      if (!value) throw new Error('--output 需要输出文件路径');
      options.outputPath = value;
      index += 1;
      continue;
    }

    if (arg === '--summary') {
      const value = argv[index + 1];
      if (!value) throw new Error('--summary 需要 Markdown 输出路径');
      options.summaryPath = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('-')) {
      throw new Error(`未知参数: ${arg}`);
    }

    options.sampleFilter = arg;
  }

  return options;
};

const printUsage = () => {
  console.error('用法: npm run perf:jsonpath -- [--sample reward-response] [--iterations 3] [--strict] [--output perf.json] [--summary perf.md]');
};

const writeTextFile = async (filePath, text, options = {}) => {
  const absolutePath = path.resolve(process.cwd(), filePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, text, options);
  return absolutePath;
};

const runCli = async () => {
  const [, scriptPath, ...args] = process.argv;
  const isMain = scriptPath && import.meta.url === new URL(scriptPath, 'file:').href;
  if (!isMain) return;

  try {
    const options = parseCliArgs(args);
    const budget = await buildJsonPathPerformanceBudget(options);
    const jsonText = `${JSON.stringify(budget, null, 2)}\n`;
    process.stdout.write(jsonText);
    if (options.outputPath) {
      const outputPath = await writeTextFile(options.outputPath, jsonText);
      console.error(`已写入 JSONPath 性能预算: ${outputPath}`);
    }
    if (options.summaryPath) {
      const summaryPath = await writeTextFile(
        options.summaryPath,
        formatJsonPathPerformanceBudgetMarkdown(budget),
        { flag: 'a' }
      );
      console.error(`已写入 JSONPath 性能摘要: ${summaryPath}`);
    }
    if (options.strict && !budget.summary.pass) {
      console.error('perf:jsonpath strict 检查失败:');
      budget.cases.forEach(result => {
        result.failures.forEach(failure => {
          console.error(`- ${result.name}.${failure.key}: ${failure.message}`);
        });
      });
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    printUsage();
    process.exitCode = 1;
  }
};

await runCli();
