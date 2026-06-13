#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';
import { buildCorpusResponseText } from './scheme-corpus-snapshot.mjs';

export const SCHEME_PERFORMANCE_BUDGET_KIND = 'json-helper-scheme-performance-budget';

export const DEFAULT_PERFORMANCE_CASES = [
  {
    name: 'response-50kb',
    targetBytes: 50 * 1024,
    maxDurationMs: 3_000,
    maxUnresolved: 0,
    maxWarnings: 0,
  },
  {
    name: 'response-250kb',
    targetBytes: 250 * 1024,
    maxDurationMs: 12_000,
    maxUnresolved: 0,
    maxWarnings: 0,
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

export const buildSizedResponseText = (sourceText, targetBytes) => {
  const sourceBytes = byteLength(sourceText);
  if (sourceBytes >= targetBytes) return sourceText;

  const sourceValue = parseJsonInput(sourceText, 'performance source');
  if (!sourceValue || typeof sourceValue !== 'object' || Array.isArray(sourceValue)) {
    throw new Error('performance source 必须是 JSON object');
  }

  const output = {
    ...sourceValue,
    _performance_padding: '',
  };
  const estimate = Math.max(0, targetBytes - byteLength(JSON.stringify(output)));
  output._performance_padding = 'x'.repeat(estimate);

  let text = JSON.stringify(output);
  const gap = targetBytes - byteLength(text);
  if (gap > 0) {
    output._performance_padding += 'x'.repeat(gap);
    text = JSON.stringify(output);
  }

  return text;
};

export const percentile = (values, ratio) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * ratio) - 1)
  );
  return sorted[index];
};

const roundDuration = value => Math.round(value * 10) / 10;

const listFailures = (caseConfig, durationMs, report) => {
  const failures = [];
  if (durationMs > caseConfig.maxDurationMs) {
    failures.push({
      key: 'durationMs',
      actual: durationMs,
      expected: caseConfig.maxDurationMs,
      message: `耗时 ${durationMs}ms 超过预算 ${caseConfig.maxDurationMs}ms`,
    });
  }
  if (report.summary.unresolvedCount > caseConfig.maxUnresolved) {
    failures.push({
      key: 'unresolved',
      actual: report.summary.unresolvedCount,
      expected: caseConfig.maxUnresolved,
      message: `待检查 ${report.summary.unresolvedCount} 超过预算 ${caseConfig.maxUnresolved}`,
    });
  }
  if (report.summary.warningCount > caseConfig.maxWarnings) {
    failures.push({
      key: 'warnings',
      actual: report.summary.warningCount,
      expected: caseConfig.maxWarnings,
      message: `跳过 ${report.summary.warningCount} 超过预算 ${caseConfig.maxWarnings}`,
    });
  }
  return failures;
};

export const buildPerformanceCaseResult = ({
  caseConfig,
  responseBytes,
  durations,
  report,
}) => {
  const medianMs = roundDuration(percentile(durations, 0.5));
  const maxMs = roundDuration(Math.max(...durations));
  const failures = listFailures(caseConfig, medianMs, report);

  return {
    name: caseConfig.name,
    targetBytes: caseConfig.targetBytes,
    responseBytes,
    iterations: durations.length,
    durationMs: {
      median: medianMs,
      max: maxMs,
      budget: caseConfig.maxDurationMs,
    },
    pass: failures.length === 0,
    failures,
    quality: {
      coverageScore: report.coverage.score,
      records: report.summary.recordCount,
      cmdStructures: report.cmdStructureCount,
      nestedCommandFields: report.nestedCommandFieldCount,
      nestedResourceFields: report.nestedResourceFieldCount || 0,
      runtimePlaceholders: report.summary.placeholderCount,
      unresolved: report.summary.unresolvedCount,
      warnings: report.summary.warningCount,
    },
  };
};

const loadTransformModules = async () => {
  const inlineConfig = {
    root: FRONTEND_ROOT,
    configFile: false,
    logLevel: 'error',
  };
  const transformations = await runnerImport(
    path.join(FRONTEND_ROOT, 'src', 'utils', 'transformations.ts'),
    inlineConfig
  );
  const transformSummary = await runnerImport(
    path.join(FRONTEND_ROOT, 'src', 'utils', 'transformSummary.ts'),
    inlineConfig
  );

  return {
    deepParseWithContext: transformations.module.deepParseWithContext,
    buildTransformContextReport: transformSummary.module.buildTransformContextReport,
  };
};

const runPerformanceCase = ({
  caseConfig,
  responseText,
  iterations,
  modules,
}) => {
  const durations = [];
  let report;

  for (let index = 0; index < iterations; index += 1) {
    const start = performance.now();
    const { context } = modules.deepParseWithContext(responseText, { autoExpandScheme: true });
    report = modules.buildTransformContextReport(context);
    durations.push(performance.now() - start);
  }

  return buildPerformanceCaseResult({
    caseConfig,
    responseBytes: byteLength(responseText),
    durations,
    report,
  });
};

const loadCorpusFixture = async sampleFilter => {
  const filename = `${sampleFilter}.redacted.json`;
  const fixturePath = path.join(CORPUS_DIR, filename);
  return parseJsonInput(await readFile(fixturePath, 'utf8'), filename);
};

export const buildPerformanceBudget = async ({
  sampleFilter = 'reward-response',
  iterations = 3,
  cases = DEFAULT_PERFORMANCE_CASES,
} = {}) => {
  const fixture = await loadCorpusFixture(sampleFilter);
  const sourceText = buildCorpusResponseText(fixture);
  const modules = await loadTransformModules();
  const normalizedIterations = Math.max(1, Number(iterations) || 1);
  const results = cases.map(caseConfig => runPerformanceCase({
    caseConfig,
    responseText: buildSizedResponseText(sourceText, caseConfig.targetBytes),
    iterations: normalizedIterations,
    modules,
  }));

  return {
    schemaVersion: 1,
    kind: SCHEME_PERFORMANCE_BUDGET_KIND,
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

export const formatPerformanceBudgetMarkdown = budget => {
  const lines = [
    '# Scheme 解析性能预算',
    '',
    `- 样本: ${budget.sample}`,
    `- 轮次: ${budget.iterations}`,
    `- 结果: ${budget.summary.pass ? 'PASS' : 'FAIL'}`,
    '',
    '| Case | 大小 | Median | Max | 预算 | 覆盖率 | 展开 | CMD结构 | 资源字段 | 待检查 | 跳过 | 结果 |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
  ];

  budget.cases.forEach(result => {
    lines.push([
      formatMarkdownValue(result.name),
      result.responseBytes,
      `${result.durationMs.median}ms`,
      `${result.durationMs.max}ms`,
      `${result.durationMs.budget}ms`,
      result.quality.coverageScore,
      result.quality.records,
      result.quality.cmdStructures,
      result.quality.nestedResourceFields,
      result.quality.unresolved,
      result.quality.warnings,
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
  console.error('用法: npm run perf:scheme -- [--sample reward-response] [--iterations 3] [--strict] [--output perf.json] [--summary perf.md]');
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
    const budget = await buildPerformanceBudget(options);
    const jsonText = `${JSON.stringify(budget, null, 2)}\n`;
    process.stdout.write(jsonText);
    if (options.outputPath) {
      const outputPath = await writeTextFile(options.outputPath, jsonText);
      console.error(`已写入性能预算: ${outputPath}`);
    }
    if (options.summaryPath) {
      const summaryPath = await writeTextFile(
        options.summaryPath,
        formatPerformanceBudgetMarkdown(budget),
        { flag: 'a' }
      );
      console.error(`已写入性能摘要: ${summaryPath}`);
    }
    if (options.strict && !budget.summary.pass) {
      console.error('perf:scheme strict 检查失败:');
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
