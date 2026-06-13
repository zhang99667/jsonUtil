#!/usr/bin/env node

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

export const SCHEME_CORPUS_SNAPSHOT_KIND = 'json-helper-scheme-corpus-quality-snapshot';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(__dirname, '..');
const CORPUS_DIR = path.join(FRONTEND_ROOT, 'fixtures', 'scheme-corpus');

const isRecord = value => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const parseJsonInput = (text, label) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    const detail = error instanceof SyntaxError ? error.message : String(error);
    throw new Error(`${label} 不是有效 JSON: ${detail}`);
  }
};

export const applyCorpusReplacements = (value, replacements) => {
  if (typeof value === 'string') {
    return Array.isArray(replacements[value]) ? replacements[value].join('') : value;
  }

  if (Array.isArray(value)) {
    return value.map(item => applyCorpusReplacements(item, replacements));
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        applyCorpusReplacements(child, replacements),
      ])
    );
  }

  return value;
};

export const buildCorpusResponseText = fixture => (
  JSON.stringify(applyCorpusReplacements(fixture.responseTemplate, fixture.replacements || {}))
);

const createThresholdResult = (actual, expected, pass) => ({
  actual,
  expected,
  pass,
});

const addOptionalThreshold = (results, key, actual, expected, compare) => {
  if (expected === undefined) return;
  results[key] = createThresholdResult(actual, expected, compare(actual, expected));
};

export const buildThresholdResults = (report, qualitySnapshot, expectedSnapshot) => {
  const quality = expectedSnapshot?.quality;
  if (!quality) return {};

  const results = {};
  addOptionalThreshold(results, 'minCoverageScore', report.coverage.score, quality.minCoverageScore, (actual, expected) => actual >= expected);
  addOptionalThreshold(results, 'minCmdStructures', report.cmdStructureCount, quality.minCmdStructures, (actual, expected) => actual >= expected);
  addOptionalThreshold(results, 'minNestedCommandFields', report.nestedCommandFieldCount, quality.minNestedCommandFields, (actual, expected) => actual >= expected);
  addOptionalThreshold(results, 'minNestedResourceFields', report.nestedResourceFieldCount || 0, quality.minNestedResourceFields, (actual, expected) => actual >= expected);
  addOptionalThreshold(results, 'maxUnresolved', report.summary.unresolvedCount, quality.maxUnresolved, (actual, expected) => actual <= expected);
  addOptionalThreshold(results, 'maxWarnings', report.summary.warningCount, quality.maxWarnings, (actual, expected) => actual <= expected);
  addOptionalThreshold(
    results,
    'leadHotspotCommandSchema',
    qualitySnapshot.hotspots.topCommandSchemas[0]?.schema,
    quality.leadHotspotCommandSchema,
    (actual, expected) => actual === expected
  );
  addOptionalThreshold(
    results,
    'leadHotspotResourceSchema',
    qualitySnapshot.hotspots.topResourceSchemas[0]?.schema,
    quality.leadHotspotResourceSchema,
    (actual, expected) => actual === expected
  );
  addOptionalThreshold(
    results,
    'leadHotspotResourceField',
    qualitySnapshot.hotspots.topNestedResourceFields[0]?.key,
    quality.leadHotspotResourceField,
    (actual, expected) => actual === expected
  );

  return results;
};

export const buildCorpusSnapshotSample = ({
  fixture,
  expectedSnapshot,
  responseText,
  report,
  reportView,
  qualitySnapshot,
}) => ({
  sample: fixture.name,
  baseline: fixture.baseline,
  responseBytes: Buffer.byteLength(responseText, 'utf8'),
  summaryText: report.summaryText || '深度解析: 无展开记录',
  coverage: report.coverage,
  totals: qualitySnapshot.totals,
  filtered: qualitySnapshot.filtered,
  topCommandSchemas: qualitySnapshot.hotspots.topCommandSchemas,
  topResourceSchemas: qualitySnapshot.hotspots.topResourceSchemas,
  topNestedCommandFields: qualitySnapshot.hotspots.topNestedCommandFields,
  topNestedResourceFields: qualitySnapshot.hotspots.topNestedResourceFields,
  runtimePlaceholders: report.runtimePlaceholderGroups.map(group => ({
    value: group.value,
    count: group.count,
    sourceCount: group.sourceCount,
  })),
  thresholds: buildThresholdResults(report, qualitySnapshot, expectedSnapshot),
  truncated: {
    records: reportView.isRecordTruncated,
    cmdStructures: reportView.isCmdStructureTruncated,
    runtimePlaceholders: reportView.isPlaceholderTruncated,
    unresolved: reportView.isUnresolvedTruncated,
    warnings: reportView.isWarningTruncated,
  },
});

export const listMissingBaselines = samples => (
  samples
    .filter(sample => sample.baseline && !sample.baseline.expectedSnapshot)
    .map(sample => ({
      sample: sample.sample,
      expectedSnapshot: sample.baseline.expectedSnapshotFile,
    }))
);

export const listThresholdFailures = samples => (
  samples.flatMap(sample => (
    Object.entries(sample.thresholds || {})
      .filter(([, result]) => result && result.pass === false)
      .map(([key, result]) => ({
        sample: sample.sample,
        key,
        actual: result.actual,
        expected: result.expected,
      }))
  ))
);

export const buildThresholdSummary = samples => {
  const thresholdCount = samples.reduce((total, sample) => (
    total + Object.keys(sample.thresholds || {}).length
  ), 0);
  const missingBaselines = listMissingBaselines(samples);
  const failures = listThresholdFailures(samples);

  return {
    pass: failures.length === 0 && missingBaselines.length === 0,
    total: thresholdCount,
    failed: failures.length,
    missingBaselines,
    failures,
  };
};

const formatMarkdownValue = value => (
  String(value ?? '').replace(/\|/g, '\\|')
);

export const formatCorpusSnapshotMarkdownSummary = snapshot => {
  const lines = [
    '# Scheme Corpus 质量快照',
    '',
    `- 样本数: ${snapshot.sampleCount}`,
    `- 缺失基线: ${snapshot.thresholdSummary.missingBaselines.length}`,
    `- 阈值失败: ${snapshot.thresholdSummary.failed}/${snapshot.thresholdSummary.total}`,
    `- 结果: ${snapshot.thresholdSummary.pass ? 'PASS' : 'FAIL'}`,
    '',
    '| 样本 | 基线 | 覆盖率 | 展开记录 | CMD | CMD字段 | 资源字段 | 占位符 | 待检查 | 跳过 | 阈值失败 |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ];

  snapshot.samples.forEach(sample => {
    const thresholdCount = Object.keys(sample.thresholds || {}).length;
    const failedCount = Object.values(sample.thresholds || {})
      .filter(result => result && result.pass === false).length;
    const baselineLabel = sample.baseline
      ? (sample.baseline.expectedSnapshot ? '已配置' : '缺失')
      : '临时输入';
    lines.push([
      formatMarkdownValue(sample.sample),
      baselineLabel,
      sample.coverage.score,
      sample.totals.records,
      sample.totals.cmdStructures,
      sample.totals.nestedCommandFields,
      sample.totals.nestedResourceFields,
      sample.totals.runtimePlaceholders,
      sample.totals.unresolved,
      sample.totals.warnings,
      `${failedCount}/${thresholdCount}`,
    ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
  });

  if (snapshot.thresholdSummary.missingBaselines.length > 0) {
    lines.push('', '## 缺失基线', '');
    snapshot.thresholdSummary.missingBaselines.forEach(missing => {
      lines.push(`- ${formatMarkdownValue(missing.sample)}: ${missing.expectedSnapshot}`);
    });
  }

  if (snapshot.thresholdSummary.failures.length > 0) {
    lines.push('', '## 失败阈值', '');
    snapshot.thresholdSummary.failures.forEach(failure => {
      lines.push(`- ${formatMarkdownValue(failure.sample)}.${failure.key}: actual=${JSON.stringify(failure.actual)}, expected=${JSON.stringify(failure.expected)}`);
    });
  }

  return `${lines.join('\n')}\n`;
};

const buildSnapshotSampleFromResponseText = ({
  sampleName,
  baseline,
  expectedSnapshot,
  responseText,
  modules,
}) => {
  const { context } = modules.deepParseWithContext(responseText, { autoExpandScheme: true });
  const report = modules.buildTransformContextReport(context);
  const reportView = modules.buildTransformReportView(report, '');
  const qualitySnapshot = parseJsonInput(
    modules.formatTransformQualitySnapshotJsonText(report, reportView, ''),
    `${sampleName} quality snapshot`
  );

  return buildCorpusSnapshotSample({
    fixture: {
      name: sampleName,
      baseline,
    },
    expectedSnapshot,
    responseText,
    report,
    reportView,
    qualitySnapshot,
  });
};

const loadJsonFile = async filePath => (
  parseJsonInput(await readFile(filePath, 'utf8'), path.basename(filePath))
);

const isFileNotFoundError = error => (
  Boolean(error) && typeof error === 'object' && error.code === 'ENOENT'
);

const listCorpusFixtures = async sampleFilter => {
  const filenames = (await readdir(CORPUS_DIR))
    .filter(filename => filename.endsWith('.redacted.json'))
    .sort();
  const fixtures = await Promise.all(filenames.map(async filename => {
    const prefix = filename.replace(/\.redacted\.json$/, '');
    const fixture = await loadJsonFile(path.join(CORPUS_DIR, filename));
    const expectedPath = path.join(CORPUS_DIR, `${prefix}.expected.snapshot.json`);
    let expectedSnapshot;
    try {
      expectedSnapshot = await loadJsonFile(expectedPath);
    } catch (error) {
      if (!isFileNotFoundError(error)) throw error;
      expectedSnapshot = undefined;
    }

    return {
      prefix,
      fixture: {
        ...fixture,
        baseline: {
          expectedSnapshot: Boolean(expectedSnapshot),
          expectedSnapshotFile: path.basename(expectedPath),
        },
      },
      expectedSnapshot,
    };
  }));

  if (!sampleFilter) return fixtures;

  const matched = fixtures.filter(item => (
    item.prefix === sampleFilter ||
    item.fixture.name === sampleFilter
  ));
  if (matched.length === 0) {
    throw new Error(`未找到 corpus 样本: ${sampleFilter}`);
  }

  return matched;
};

const normalizeInputSampleName = inputPath => {
  const basename = path.basename(inputPath);
  return basename
    .replace(/\.redacted\.json$/i, '')
    .replace(/\.(json|txt)$/i, '') || 'input-response';
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
    buildTransformReportView: transformSummary.module.buildTransformReportView,
    formatTransformQualitySnapshotJsonText: transformSummary.module.formatTransformQualitySnapshotJsonText,
  };
};

export const buildCorpusSnapshot = async ({ sampleFilter, inputPath, sampleName } = {}) => {
  const modules = await loadTransformModules();
  if (inputPath) {
    const absoluteInputPath = path.resolve(process.cwd(), inputPath);
    const responseText = await readFile(absoluteInputPath, 'utf8');
    const samples = [buildSnapshotSampleFromResponseText({
      sampleName: sampleName || normalizeInputSampleName(inputPath),
      responseText,
      modules,
    })];

    return {
      schemaVersion: 1,
      kind: SCHEME_CORPUS_SNAPSHOT_KIND,
      source: 'input',
      input: absoluteInputPath,
      sampleCount: samples.length,
      thresholdSummary: buildThresholdSummary(samples),
      samples,
    };
  }

  const fixtures = await listCorpusFixtures(sampleFilter);
  const samples = fixtures.map(({ fixture, expectedSnapshot }) => (
    buildSnapshotSampleFromResponseText({
      sampleName: fixture.name,
      baseline: fixture.baseline,
      expectedSnapshot,
      responseText: buildCorpusResponseText(fixture),
      modules,
    })
  ));

  return {
    schemaVersion: 1,
    kind: SCHEME_CORPUS_SNAPSHOT_KIND,
    sampleCount: samples.length,
    thresholdSummary: buildThresholdSummary(samples),
    samples,
  };
};

export const parseCliArgs = argv => {
  const options = {
    sampleFilter: undefined,
    inputPath: undefined,
    sampleName: undefined,
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

    if (arg === '--input') {
      const value = argv[index + 1];
      if (!value) throw new Error('--input 需要 response 文件路径');
      options.inputPath = value;
      index += 1;
      continue;
    }

    if (arg === '--name') {
      const value = argv[index + 1];
      if (!value) throw new Error('--name 需要样本名');
      options.sampleName = value;
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
      if (!value) throw new Error('--summary 需要 Markdown 输出文件路径');
      options.summaryPath = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('-')) {
      throw new Error(`未知参数: ${arg}`);
    }

    if (options.sampleFilter) {
      throw new Error('一次只能指定一个样本名');
    }
    options.sampleFilter = arg;
  }

  if (options.inputPath && options.sampleFilter) {
    throw new Error('--input 不能和 corpus 样本名同时使用');
  }

  if (options.sampleName && !options.inputPath) {
    throw new Error('--name 只能和 --input 一起使用');
  }

  return options;
};

const printUsage = () => {
  console.error('用法: npm run corpus:snapshot -- [--sample reward-response-redacted] [--strict] [--output snapshot.json] [--summary summary.md]');
  console.error('或: npm run corpus:snapshot -- --input /path/to/response.json --name local-response');
  console.error('默认扫描 fixtures/scheme-corpus 下所有 *.redacted.json 样本，并输出质量快照 JSON。');
};

const formatThresholdFailure = failure => (
  `${failure.sample}.${failure.key}: actual=${JSON.stringify(failure.actual)}, expected=${JSON.stringify(failure.expected)}`
);

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
    const snapshot = await buildCorpusSnapshot(options);
    const snapshotJsonText = `${JSON.stringify(snapshot, null, 2)}\n`;
    process.stdout.write(snapshotJsonText);
    if (options.outputPath) {
      const outputPath = await writeTextFile(options.outputPath, snapshotJsonText);
      console.error(`已写入质量快照: ${outputPath}`);
    }
    if (options.summaryPath) {
      const summaryPath = await writeTextFile(
        options.summaryPath,
        formatCorpusSnapshotMarkdownSummary(snapshot),
        { flag: 'a' }
      );
      console.error(`已写入质量摘要: ${summaryPath}`);
    }
    if (options.strict && !snapshot.thresholdSummary.pass) {
      console.error('corpus:snapshot strict 检查失败:');
      snapshot.thresholdSummary.missingBaselines.forEach(missing => {
        console.error(`- ${missing.sample}: 缺失 ${missing.expectedSnapshot}`);
      });
      snapshot.thresholdSummary.failures.forEach(failure => {
        console.error(`- ${formatThresholdFailure(failure)}`);
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
