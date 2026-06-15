#!/usr/bin/env node

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';
import { diffCmdStructures, normalizeCmdStructure } from './cmd-structure-diff.mjs';

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

const uniqueStrings = values => {
  const result = [];
  const seen = new Set();
  values.forEach(value => {
    if (typeof value !== 'string' || seen.has(value)) return;
    seen.add(value);
    result.push(value);
  });
  return result;
};

const collectCommandSchemas = report => {
  const records = Array.isArray(report.records) ? report.records : [];
  return uniqueStrings(records.flatMap(record => [
    record?.commandSchema,
    ...(Array.isArray(record?.commandSchemaRows)
      ? record.commandSchemaRows.map(row => row?.schema)
      : []),
  ]));
};

const collectRuntimePlaceholders = report => (
  uniqueStrings((report.runtimePlaceholderGroups || []).map(group => group?.value))
);

const normalizeScanLocation = location => {
  if (!isRecord(location) || typeof location.path !== 'string') return undefined;
  const normalized = { path: location.path };
  if (typeof location.label === 'string') normalized.label = location.label;
  const type = typeof location.type === 'string' ? location.type : location.schemeType;
  if (typeof type === 'string') normalized.type = type;
  return normalized;
};

const normalizeScanLocations = locations => (
  (Array.isArray(locations) ? locations : [])
    .map(normalizeScanLocation)
    .filter(Boolean)
);

const buildRequiredSetResult = (actual, expected) => {
  const actualSet = new Set(actual);
  const missing = expected.filter(item => !actualSet.has(item));
  return {
    actual,
    expected,
    missing,
    pass: missing.length === 0,
  };
};

const buildRequiredExactListResult = (actual, expected) => {
  const actualKeys = new Set(actual.map(item => JSON.stringify(item)));
  const expectedKeys = new Set(expected.map(item => JSON.stringify(item)));
  const missing = expected.filter(item => !actualKeys.has(JSON.stringify(item)));
  const extra = actual.filter(item => !expectedKeys.has(JSON.stringify(item)));
  return {
    actual,
    expected,
    missing,
    extra,
    pass: missing.length === 0 && extra.length === 0,
  };
};

export const buildThresholdResults = (report, qualitySnapshot, expectedSnapshot, cmdHandlerAlignment) => {
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
    'maxCmdHandlerIgnoredExtraPaths',
    cmdHandlerAlignment?.ignoredExtraPaths,
    quality.maxCmdHandlerIgnoredExtraPaths,
    (actual, expected) => typeof actual === 'number' && actual <= expected
  );
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

export const buildRequiredResults = ({ report, expectedSnapshot, scanLocations = [] }) => {
  const results = {};
  if (Array.isArray(expectedSnapshot?.requiredCommandSchemas)) {
    results.requiredCommandSchemas = buildRequiredSetResult(
      collectCommandSchemas(report),
      uniqueStrings(expectedSnapshot.requiredCommandSchemas)
    );
  }
  if (Array.isArray(expectedSnapshot?.requiredRuntimePlaceholders)) {
    results.requiredRuntimePlaceholders = buildRequiredSetResult(
      collectRuntimePlaceholders(report),
      uniqueStrings(expectedSnapshot.requiredRuntimePlaceholders)
    );
  }
  if (Array.isArray(expectedSnapshot?.scanLocations)) {
    results.scanLocations = buildRequiredExactListResult(
      normalizeScanLocations(scanLocations),
      normalizeScanLocations(expectedSnapshot.scanLocations)
    );
  }
  return results;
};

const findCmdStructureRecord = (report, expectedSnapshot) => {
  const records = Array.isArray(report.records) ? report.records : [];
  const primaryCommandSchema = expectedSnapshot?.primaryCommandSchema;
  if (primaryCommandSchema) {
    const record = records.find(item => (
      item?.commandSchema === primaryCommandSchema &&
      typeof item.getCmdStructureCopyText === 'function'
    ));
    if (record) return record;
  }

  return records.find(item => typeof item?.getCmdStructureCopyText === 'function');
};

const summarizeCmdHandlerDiff = diff => ({
  schemaDiff: diff.schemaDiff,
  sourceDiff: diff.sourceDiff,
  missingPathCount: diff.missingPaths.length,
  extraPathCount: diff.extraPaths.length,
  ignoredExtraPathCount: diff.ignoredExtraPaths.length,
  valueDiffCount: diff.valueDiffs.length,
  missingPaths: diff.missingPaths.slice(0, 20),
  extraPaths: diff.extraPaths.slice(0, 20),
  ignoredExtraPaths: diff.ignoredExtraPaths.slice(0, 20),
  valueDiffs: diff.valueDiffs.slice(0, 20),
});

export const buildCmdHandlerAlignment = ({
  sampleName,
  report,
  expectedSnapshot,
  cmdHandlerExpected,
}) => {
  if (!expectedSnapshot?.cmdHandlerExpected || cmdHandlerExpected === undefined) {
    return undefined;
  }

  const record = findCmdStructureRecord(report, expectedSnapshot);
  if (!record) {
    return {
      expectedFile: expectedSnapshot.cmdHandlerExpected,
      ignoreExtraPaths: true,
      pass: false,
      reason: 'missingActualCmdStructure',
      actualCommandSchema: undefined,
      expectedCommandSchema: normalizeCmdStructure(cmdHandlerExpected).cmdSchema,
      schemaDiff: false,
      sourceDiff: false,
      missingPaths: 0,
      extraPaths: 0,
      ignoredExtraPaths: 0,
      valueDiffs: 0,
    };
  }

  const actual = parseJsonInput(
    record.getCmdStructureCopyText(),
    `${sampleName} cmdHandler actual`
  );
  const diff = diffCmdStructures(actual, cmdHandlerExpected, { ignoreExtraPaths: true });
  const actualCmdStructure = normalizeCmdStructure(actual);
  const expectedCmdStructure = normalizeCmdStructure(cmdHandlerExpected);

  return {
    expectedFile: expectedSnapshot.cmdHandlerExpected,
    ignoreExtraPaths: true,
    pass: !diff.hasDifferences,
    actualCommandSchema: actualCmdStructure.cmdSchema,
    expectedCommandSchema: expectedCmdStructure.cmdSchema,
    schemaDiff: Boolean(diff.schemaDiff),
    sourceDiff: Boolean(diff.sourceDiff),
    missingPaths: diff.missingPaths.length,
    extraPaths: diff.extraPaths.length,
    ignoredExtraPaths: diff.ignoredExtraPaths.length,
    valueDiffs: diff.valueDiffs.length,
    diff: summarizeCmdHandlerDiff(diff),
  };
};

export const buildCorpusSnapshotSample = ({
  fixture,
  expectedSnapshot,
  cmdHandlerExpected,
  responseText,
  report,
  reportView,
  qualitySnapshot,
  scanLocations = [],
}) => {
  const cmdHandlerAlignment = buildCmdHandlerAlignment({
    sampleName: fixture.name,
    report,
    expectedSnapshot,
    cmdHandlerExpected,
  });

  return {
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
    scanLocations: normalizeScanLocations(scanLocations),
    runtimePlaceholders: report.runtimePlaceholderGroups.map(group => ({
      value: group.value,
      count: group.count,
      sourceCount: group.sourceCount,
    })),
    cmdHandlerAlignment,
    thresholds: buildThresholdResults(report, qualitySnapshot, expectedSnapshot, cmdHandlerAlignment),
    requiredChecks: buildRequiredResults({
      report,
      expectedSnapshot,
      scanLocations,
    }),
    truncated: {
      records: reportView.isRecordTruncated,
      cmdStructures: reportView.isCmdStructureTruncated,
      runtimePlaceholders: reportView.isPlaceholderTruncated,
      unresolved: reportView.isUnresolvedTruncated,
      warnings: reportView.isWarningTruncated,
    },
  };
};

export const listMissingBaselines = samples => (
  samples.flatMap(sample => {
    const missing = [];
    if (sample.baseline && !sample.baseline.expectedSnapshot) {
      missing.push({
        sample: sample.sample,
        expectedSnapshot: sample.baseline.expectedSnapshotFile,
      });
    }
    if (sample.baseline?.expectedSnapshot && sample.baseline.cmdHandlerExpected === false) {
      missing.push({
        sample: sample.sample,
        cmdHandlerExpected: sample.baseline.cmdHandlerExpectedFile || '(未配置 cmdHandlerExpected)',
      });
    }
    return missing;
  })
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

export const listRequiredFailures = samples => (
  samples.flatMap(sample => (
    Object.entries(sample.requiredChecks || {})
      .filter(([, result]) => result && result.pass === false)
      .map(([key, result]) => ({
        sample: sample.sample,
        key,
        actual: result.actual,
        expected: result.expected,
        missing: result.missing || [],
        extra: result.extra || [],
      }))
  ))
);

export const listCmdHandlerFailures = samples => (
  samples
    .filter(sample => sample.cmdHandlerAlignment && !sample.cmdHandlerAlignment.pass)
    .map(sample => ({
      sample: sample.sample,
      expectedFile: sample.cmdHandlerAlignment.expectedFile,
      reason: sample.cmdHandlerAlignment.reason,
      schemaDiff: sample.cmdHandlerAlignment.schemaDiff,
      sourceDiff: sample.cmdHandlerAlignment.sourceDiff,
      missingPaths: sample.cmdHandlerAlignment.missingPaths,
      extraPaths: sample.cmdHandlerAlignment.extraPaths,
      ignoredExtraPaths: sample.cmdHandlerAlignment.ignoredExtraPaths || 0,
      valueDiffs: sample.cmdHandlerAlignment.valueDiffs,
    }))
);

export const buildThresholdSummary = samples => {
  const thresholdCount = samples.reduce((total, sample) => (
    total + Object.keys(sample.thresholds || {}).length
  ), 0);
  const missingBaselines = listMissingBaselines(samples);
  const failures = listThresholdFailures(samples);
  const requiredFailures = listRequiredFailures(samples);
  const cmdHandlerFailures = listCmdHandlerFailures(samples);
  const cmdHandlerTotal = samples.filter(sample => sample.cmdHandlerAlignment).length;
  const cmdHandlerIgnoredExtraPaths = samples.reduce((total, sample) => (
    total + (sample.cmdHandlerAlignment?.ignoredExtraPaths || 0)
  ), 0);
  const requiredCount = samples.reduce((total, sample) => (
    total + Object.keys(sample.requiredChecks || {}).length
  ), 0);

  return {
    pass: failures.length === 0 &&
      missingBaselines.length === 0 &&
      requiredFailures.length === 0 &&
      cmdHandlerFailures.length === 0,
    total: thresholdCount,
    failed: failures.length,
    missingBaselines,
    failures,
    required: {
      total: requiredCount,
      failed: requiredFailures.length,
      failures: requiredFailures,
    },
    cmdHandler: {
      total: cmdHandlerTotal,
      failed: cmdHandlerFailures.length,
      ignoredExtraPaths: cmdHandlerIgnoredExtraPaths,
      failures: cmdHandlerFailures,
    },
  };
};

const formatMarkdownValue = value => (
  String(value ?? '').replace(/\|/g, '\\|')
);

const formatCmdHandlerMarkdownLabel = sample => {
  if (sample.cmdHandlerAlignment) {
    const ignoredExtraPaths = sample.cmdHandlerAlignment.ignoredExtraPaths || 0;
    const ignoredLabel = ignoredExtraPaths > 0 ? `(忽略 ${ignoredExtraPaths})` : '';
    return sample.cmdHandlerAlignment.pass ? `一致${ignoredLabel}` : `失败${ignoredLabel}`;
  }
  if (sample.baseline && !sample.baseline.expectedSnapshot) {
    return '缺失';
  }
  if (sample.baseline?.expectedSnapshot && sample.baseline.cmdHandlerExpected === false) {
    return '缺失';
  }
  return sample.baseline ? '未配置' : '临时输入';
};

const getIgnoredExtraPathSamples = samples => (
  samples
    .map(sample => ({
      sample: sample.sample,
      total: sample.cmdHandlerAlignment?.ignoredExtraPaths || 0,
      paths: sample.cmdHandlerAlignment?.diff?.ignoredExtraPaths || [],
    }))
    .filter(item => item.total > 0 && item.paths.length > 0)
);

export const formatCorpusSnapshotMarkdownSummary = snapshot => {
  const requiredSummary = snapshot.thresholdSummary.required || {
    total: 0,
    failed: 0,
    failures: [],
  };
  const ignoredExtraPathSamples = getIgnoredExtraPathSamples(snapshot.samples || []);
  const lines = [
    '# Scheme Corpus 质量快照',
    '',
    `- 样本数: ${snapshot.sampleCount}`,
    `- 缺失基线: ${snapshot.thresholdSummary.missingBaselines.length}`,
    `- 阈值失败: ${snapshot.thresholdSummary.failed}/${snapshot.thresholdSummary.total}`,
    `- 必需项失败: ${requiredSummary.failed}/${requiredSummary.total}`,
    `- cmdHandler 对齐失败: ${snapshot.thresholdSummary.cmdHandler.failed}/${snapshot.thresholdSummary.cmdHandler.total}`,
    `- cmdHandler 已忽略 extra: ${snapshot.thresholdSummary.cmdHandler.ignoredExtraPaths || 0}`,
    `- 结果: ${snapshot.thresholdSummary.pass ? 'PASS' : 'FAIL'}`,
    '',
    '| 样本 | 基线 | cmdHandler | 覆盖率 | 展开记录 | CMD | CMD字段 | 资源字段 | 占位符 | 待检查 | 跳过 | 阈值失败 | 必需项失败 |',
    '| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ];

  snapshot.samples.forEach(sample => {
    const thresholdCount = Object.keys(sample.thresholds || {}).length;
    const failedCount = Object.values(sample.thresholds || {})
      .filter(result => result && result.pass === false).length;
    const requiredCount = Object.keys(sample.requiredChecks || {}).length;
    const requiredFailedCount = Object.values(sample.requiredChecks || {})
      .filter(result => result && result.pass === false).length;
    const baselineLabel = sample.baseline
      ? (sample.baseline.expectedSnapshot ? '已配置' : '缺失')
      : '临时输入';
    lines.push([
      formatMarkdownValue(sample.sample),
      baselineLabel,
      formatCmdHandlerMarkdownLabel(sample),
      sample.coverage.score,
      sample.totals.records,
      sample.totals.cmdStructures,
      sample.totals.nestedCommandFields,
      sample.totals.nestedResourceFields,
      sample.totals.runtimePlaceholders,
      sample.totals.unresolved,
      sample.totals.warnings,
      `${failedCount}/${thresholdCount}`,
      `${requiredFailedCount}/${requiredCount}`,
    ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
  });

  if (snapshot.thresholdSummary.missingBaselines.length > 0) {
    lines.push('', '## 缺失基线', '');
    snapshot.thresholdSummary.missingBaselines.forEach(missing => {
      if (missing.expectedSnapshot) {
        lines.push(`- ${formatMarkdownValue(missing.sample)}: 缺失 expected snapshot ${missing.expectedSnapshot}`);
      }
      if (missing.cmdHandlerExpected) {
        lines.push(`- ${formatMarkdownValue(missing.sample)}: 缺失 cmdHandler expected ${missing.cmdHandlerExpected}`);
      }
    });
  }

  if (snapshot.thresholdSummary.failures.length > 0) {
    lines.push('', '## 失败阈值', '');
    snapshot.thresholdSummary.failures.forEach(failure => {
      lines.push(`- ${formatMarkdownValue(failure.sample)}.${failure.key}: actual=${JSON.stringify(failure.actual)}, expected=${JSON.stringify(failure.expected)}`);
    });
  }

  if (requiredSummary.failures.length > 0) {
    lines.push('', '## 必需项失败', '');
    requiredSummary.failures.forEach(failure => {
      lines.push(`- ${formatMarkdownValue(failure.sample)}.${failure.key}: missing=${JSON.stringify(failure.missing)}, extra=${JSON.stringify(failure.extra)}`);
    });
  }

  if (snapshot.thresholdSummary.cmdHandler.failures.length > 0) {
    lines.push('', '## cmdHandler 对齐失败', '');
    snapshot.thresholdSummary.cmdHandler.failures.forEach(failure => {
      const reason = failure.reason ? `, reason=${failure.reason}` : '';
      lines.push(`- ${formatMarkdownValue(failure.sample)}: missingPaths=${failure.missingPaths}, valueDiffs=${failure.valueDiffs}, ignoredExtraPaths=${failure.ignoredExtraPaths || 0}, schemaDiff=${failure.schemaDiff ? '是' : '否'}${reason}`);
    });
  }

  if (ignoredExtraPathSamples.length > 0) {
    lines.push('', '## cmdHandler 已忽略 extra 样例', '');
    ignoredExtraPathSamples.forEach(sample => {
      const displayedPaths = sample.paths.slice(0, 10);
      lines.push(`- ${formatMarkdownValue(sample.sample)}: ignoredExtraPaths=${sample.total}`);
      displayedPaths.forEach(ignoredPath => {
        lines.push(`  - ${formatMarkdownValue(ignoredPath)}`);
      });
      if (sample.total > displayedPaths.length) {
        lines.push(`  - ... 还有 ${sample.total - displayedPaths.length} 个`);
      }
    });
  }

  return `${lines.join('\n')}\n`;
};

const buildSnapshotSampleFromResponseText = ({
  sampleName,
  baseline,
  expectedSnapshot,
  cmdHandlerExpected,
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
  const scanLocations = modules.scanSchemesInJson(responseText).locations.map(location => ({
    path: location.path,
    ...(location.label === undefined ? {} : { label: location.label }),
    type: location.schemeType,
  }));

  return buildCorpusSnapshotSample({
    fixture: {
      name: sampleName,
      baseline,
    },
    expectedSnapshot,
    cmdHandlerExpected,
    responseText,
    report,
    reportView,
    qualitySnapshot,
    scanLocations,
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
    let cmdHandlerExpected;
    try {
      expectedSnapshot = await loadJsonFile(expectedPath);
    } catch (error) {
      if (!isFileNotFoundError(error)) throw error;
      expectedSnapshot = undefined;
    }
    if (expectedSnapshot?.cmdHandlerExpected) {
      const cmdHandlerExpectedPath = path.join(CORPUS_DIR, expectedSnapshot.cmdHandlerExpected);
      try {
        cmdHandlerExpected = await loadJsonFile(cmdHandlerExpectedPath);
      } catch (error) {
        if (!isFileNotFoundError(error)) throw error;
        cmdHandlerExpected = undefined;
      }
    }

    return {
      prefix,
      fixture: {
        ...fixture,
        baseline: {
          expectedSnapshot: Boolean(expectedSnapshot),
          expectedSnapshotFile: path.basename(expectedPath),
          ...(expectedSnapshot
            ? {
                cmdHandlerExpected: Boolean(cmdHandlerExpected),
                cmdHandlerExpectedFile: expectedSnapshot.cmdHandlerExpected,
              }
            : {}),
        },
      },
      expectedSnapshot,
      cmdHandlerExpected,
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
  const schemeScanner = await runnerImport(
    path.join(FRONTEND_ROOT, 'src', 'utils', 'schemeScanner.ts'),
    inlineConfig
  );

  return {
    deepParseWithContext: transformations.module.deepParseWithContext,
    scanSchemesInJson: schemeScanner.module.scanSchemesInJson,
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
  const samples = fixtures.map(({ fixture, expectedSnapshot, cmdHandlerExpected }) => (
    buildSnapshotSampleFromResponseText({
      sampleName: fixture.name,
      baseline: fixture.baseline,
      expectedSnapshot,
      cmdHandlerExpected,
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

const formatRequiredFailure = failure => (
  `${failure.sample}.${failure.key}: missing=${JSON.stringify(failure.missing)}, extra=${JSON.stringify(failure.extra)}`
);

const formatMissingBaseline = missing => {
  if (missing.expectedSnapshot) {
    return `${missing.sample}: 缺失 ${missing.expectedSnapshot}`;
  }
  return `${missing.sample}: 缺失 ${missing.cmdHandlerExpected}`;
};

const formatCmdHandlerFailure = failure => {
  const reason = failure.reason ? `, reason=${failure.reason}` : '';
  return `${failure.sample}: missingPaths=${failure.missingPaths}, valueDiffs=${failure.valueDiffs}, ignoredExtraPaths=${failure.ignoredExtraPaths || 0}, schemaDiff=${failure.schemaDiff ? 'yes' : 'no'}${reason}`;
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
        console.error(`- ${formatMissingBaseline(missing)}`);
      });
      snapshot.thresholdSummary.failures.forEach(failure => {
        console.error(`- ${formatThresholdFailure(failure)}`);
      });
      snapshot.thresholdSummary.required.failures.forEach(failure => {
        console.error(`- required ${formatRequiredFailure(failure)}`);
      });
      snapshot.thresholdSummary.cmdHandler.failures.forEach(failure => {
        console.error(`- cmdHandler ${formatCmdHandlerFailure(failure)}`);
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
