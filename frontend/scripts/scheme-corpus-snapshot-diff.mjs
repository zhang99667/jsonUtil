#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const SCHEME_CORPUS_SNAPSHOT_DIFF_KIND = 'json-helper-scheme-corpus-quality-snapshot-diff';
export const SCHEME_CORPUS_SNAPSHOT_KIND = 'json-helper-scheme-corpus-quality-snapshot';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTPUT_NAME = 'scheme-corpus-snapshot-diff.json';

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

const assertSnapshot = (snapshot, label) => {
  if (!isRecord(snapshot) || snapshot.kind !== SCHEME_CORPUS_SNAPSHOT_KIND || !Array.isArray(snapshot.samples)) {
    throw new Error(`${label} 不是有效的 Scheme Corpus 质量快照`);
  }
};

const indexSamples = snapshot => (
  new Map(snapshot.samples.map(sample => [sample.sample, sample]))
);

const delta = (before, after) => (
  before === undefined || after === undefined ? undefined : after - before
);

const formatSignedDelta = value => {
  if (value === 0) return '0';
  return value > 0 ? `+${value}` : String(value);
};

const createMetricChange = (before, after) => ({
  before,
  after,
  delta: delta(before, after),
});

const buildSampleMetrics = (beforeSample, afterSample) => ({
  coverage: createMetricChange(beforeSample?.coverage?.score, afterSample?.coverage?.score),
  records: createMetricChange(beforeSample?.totals?.records, afterSample?.totals?.records),
  cmdStructures: createMetricChange(beforeSample?.totals?.cmdStructures, afterSample?.totals?.cmdStructures),
  nestedCommandFields: createMetricChange(beforeSample?.totals?.nestedCommandFields, afterSample?.totals?.nestedCommandFields),
  nestedResourceFields: createMetricChange(beforeSample?.totals?.nestedResourceFields, afterSample?.totals?.nestedResourceFields),
  runtimePlaceholders: createMetricChange(beforeSample?.totals?.runtimePlaceholders, afterSample?.totals?.runtimePlaceholders),
  unresolved: createMetricChange(beforeSample?.totals?.unresolved, afterSample?.totals?.unresolved),
  warnings: createMetricChange(beforeSample?.totals?.warnings, afterSample?.totals?.warnings),
  requiredFailures: createMetricChange(
    beforeSample === undefined ? undefined : countFailedRequiredChecks(beforeSample),
    afterSample === undefined ? undefined : countFailedRequiredChecks(afterSample)
  ),
});

const createRegression = (key, message, before, after) => ({
  key,
  message,
  before,
  after,
});

const createImprovement = (key, message, before, after) => ({
  key,
  message,
  before,
  after,
});

const listSchemas = (sample, key) => (
  (sample?.[key] || [])
    .map(item => item.schema)
    .filter(Boolean)
);

const diffList = (beforeList, afterList) => ({
  lost: beforeList.filter(item => !afterList.includes(item)),
  gained: afterList.filter(item => !beforeList.includes(item)),
});

const countFailedThresholds = sample => (
  Object.values(sample?.thresholds || {}).filter(result => result && result.pass === false).length
);

const countFailedRequiredChecks = sample => (
  Object.values(sample?.requiredChecks || {}).filter(result => result && result.pass === false).length
);

const normalizeList = value => (
  Array.isArray(value) ? value : []
);

const listRequiredCheckFailures = sample => (
  Object.entries(sample?.requiredChecks || {})
    .filter(([, result]) => result && result.pass === false)
    .map(([key, result]) => ({
      key,
      missing: normalizeList(result.missing),
      extra: normalizeList(result.extra),
    }))
);

const getRequiredFailureSignature = failure => (
  `${failure.key}:${JSON.stringify(failure.missing)}:${JSON.stringify(failure.extra)}`
);

const formatRequiredFailure = failure => (
  `${failure.key} missing=${JSON.stringify(failure.missing)} extra=${JSON.stringify(failure.extra)}`
);

const diffRequiredCheckFailures = (beforeSample, afterSample) => {
  const beforeFailures = listRequiredCheckFailures(beforeSample);
  const afterFailures = listRequiredCheckFailures(afterSample);
  const beforeSignatures = new Set(beforeFailures.map(getRequiredFailureSignature));
  const afterSignatures = new Set(afterFailures.map(getRequiredFailureSignature));

  return {
    added: afterFailures.filter(failure => !beforeSignatures.has(getRequiredFailureSignature(failure))),
    resolved: beforeFailures.filter(failure => !afterSignatures.has(getRequiredFailureSignature(failure))),
  };
};

const buildMetricRegressions = (metrics, beforeSample, afterSample) => {
  const regressions = [];
  const improvements = [];

  if (metrics.coverage.delta < 0) {
    regressions.push(createRegression('coverage', '覆盖率下降', metrics.coverage.before, metrics.coverage.after));
  } else if (metrics.coverage.delta > 0) {
    improvements.push(createImprovement('coverage', '覆盖率提升', metrics.coverage.before, metrics.coverage.after));
  }

  [
    ['cmdStructures', 'CMD 结构数量下降', 'CMD 结构数量提升'],
    ['nestedCommandFields', '内部 CMD 字段数量下降', '内部 CMD 字段数量提升'],
    ['nestedResourceFields', '资源字段数量下降', '资源字段数量提升'],
  ].forEach(([key, regressionMessage, improvementMessage]) => {
    if (metrics[key].delta < 0) {
      regressions.push(createRegression(key, regressionMessage, metrics[key].before, metrics[key].after));
    } else if (metrics[key].delta > 0) {
      improvements.push(createImprovement(key, improvementMessage, metrics[key].before, metrics[key].after));
    }
  });

  [
    ['unresolved', '待检查数量增加', '待检查数量减少'],
    ['warnings', '跳过数量增加', '跳过数量减少'],
  ].forEach(([key, regressionMessage, improvementMessage]) => {
    if (metrics[key].delta > 0) {
      regressions.push(createRegression(key, regressionMessage, metrics[key].before, metrics[key].after));
    } else if (metrics[key].delta < 0) {
      improvements.push(createImprovement(key, improvementMessage, metrics[key].before, metrics[key].after));
    }
  });

  const beforeThresholdFailures = countFailedThresholds(beforeSample);
  const afterThresholdFailures = countFailedThresholds(afterSample);
  if (afterThresholdFailures > beforeThresholdFailures) {
    regressions.push(createRegression('thresholds', '阈值失败数量增加', beforeThresholdFailures, afterThresholdFailures));
  } else if (afterThresholdFailures < beforeThresholdFailures) {
    improvements.push(createImprovement('thresholds', '阈值失败数量减少', beforeThresholdFailures, afterThresholdFailures));
  }

  const requiredFailureDiff = diffRequiredCheckFailures(beforeSample, afterSample);
  requiredFailureDiff.added.forEach(failure => {
    regressions.push(createRegression('requiredChecks', '新增必需项失败', undefined, formatRequiredFailure(failure)));
  });
  requiredFailureDiff.resolved.forEach(failure => {
    improvements.push(createImprovement('requiredChecks', '必需项失败恢复', formatRequiredFailure(failure), undefined));
  });

  return { regressions, improvements };
};

const buildCmdHandlerChange = (beforeSample, afterSample) => {
  const beforePass = beforeSample?.cmdHandlerAlignment?.pass;
  const afterPass = afterSample?.cmdHandlerAlignment?.pass;
  const regression = beforePass === true && afterPass !== true;
  const improvement = beforePass !== true && afterPass === true;

  return {
    beforePass,
    afterPass,
    regression,
    improvement,
    before: beforeSample?.cmdHandlerAlignment,
    after: afterSample?.cmdHandlerAlignment,
  };
};

const buildAddedSampleRegressions = sample => {
  const regressions = [];
  const thresholdFailures = countFailedThresholds(sample);
  if (thresholdFailures > 0) {
    regressions.push(createRegression('thresholds', '新增样本存在失败阈值', 0, thresholdFailures));
  }
  if (sample.baseline && !sample.baseline.expectedSnapshot) {
    regressions.push(createRegression('baseline', '新增样本缺失 expected snapshot', undefined, sample.baseline.expectedSnapshotFile));
  }
  if (sample.baseline?.expectedSnapshot && sample.baseline.cmdHandlerExpected === false) {
    regressions.push(createRegression('cmdHandler', '新增样本缺失 cmdHandler expected', undefined, sample.baseline.cmdHandlerExpectedFile || '(未配置 cmdHandlerExpected)'));
  }
  if (sample.cmdHandlerAlignment && sample.cmdHandlerAlignment.pass === false) {
    regressions.push(createRegression('cmdHandler', '新增样本 cmdHandler 对齐失败', undefined, sample.cmdHandlerAlignment.reason || false));
  }
  listRequiredCheckFailures(sample).forEach(failure => {
    regressions.push(createRegression('requiredChecks', '新增样本存在失败必需项', undefined, formatRequiredFailure(failure)));
  });
  return regressions;
};

export const buildSampleSnapshotDiff = (beforeSample, afterSample) => {
  if (!beforeSample && afterSample) {
    return {
      sample: afterSample.sample,
      status: 'added',
      metrics: buildSampleMetrics(undefined, afterSample),
      regressions: buildAddedSampleRegressions(afterSample),
      improvements: [],
      commandSchemas: {
        lost: [],
        gained: listSchemas(afterSample, 'topCommandSchemas'),
      },
      resourceSchemas: {
        lost: [],
        gained: listSchemas(afterSample, 'topResourceSchemas'),
      },
      cmdHandler: buildCmdHandlerChange(undefined, afterSample),
    };
  }

  if (beforeSample && !afterSample) {
    return {
      sample: beforeSample.sample,
      status: 'removed',
      metrics: buildSampleMetrics(beforeSample, undefined),
      regressions: [createRegression('sample', '样本在 after 快照中缺失', beforeSample.sample, undefined)],
      improvements: [],
      commandSchemas: {
        lost: listSchemas(beforeSample, 'topCommandSchemas'),
        gained: [],
      },
      resourceSchemas: {
        lost: listSchemas(beforeSample, 'topResourceSchemas'),
        gained: [],
      },
      cmdHandler: buildCmdHandlerChange(beforeSample, undefined),
    };
  }

  const metrics = buildSampleMetrics(beforeSample, afterSample);
  const { regressions, improvements } = buildMetricRegressions(metrics, beforeSample, afterSample);
  const commandSchemas = diffList(
    listSchemas(beforeSample, 'topCommandSchemas'),
    listSchemas(afterSample, 'topCommandSchemas')
  );
  const resourceSchemas = diffList(
    listSchemas(beforeSample, 'topResourceSchemas'),
    listSchemas(afterSample, 'topResourceSchemas')
  );
  const cmdHandler = buildCmdHandlerChange(beforeSample, afterSample);

  commandSchemas.lost.forEach(schema => {
    regressions.push(createRegression('commandSchema', 'CMD Schema 从热点中消失', schema, undefined));
  });
  resourceSchemas.lost.forEach(schema => {
    regressions.push(createRegression('resourceSchema', '资源 Schema 从热点中消失', schema, undefined));
  });
  commandSchemas.gained.forEach(schema => {
    improvements.push(createImprovement('commandSchema', '新增 CMD Schema 热点', undefined, schema));
  });
  resourceSchemas.gained.forEach(schema => {
    improvements.push(createImprovement('resourceSchema', '新增资源 Schema 热点', undefined, schema));
  });
  if (cmdHandler.regression) {
    regressions.push(createRegression('cmdHandler', 'cmdHandler 对齐从通过变为失败或缺失', true, cmdHandler.afterPass));
  }
  if (cmdHandler.improvement) {
    improvements.push(createImprovement('cmdHandler', 'cmdHandler 对齐恢复通过', cmdHandler.beforePass, true));
  }

  const changed = [
    ...Object.values(metrics).map(item => item.delta),
    commandSchemas.lost.length,
    commandSchemas.gained.length,
    resourceSchemas.lost.length,
    resourceSchemas.gained.length,
    cmdHandler.regression ? 1 : 0,
    cmdHandler.improvement ? 1 : 0,
    regressions.length,
    improvements.length,
  ].some(Boolean);

  return {
    sample: beforeSample.sample,
    status: changed ? 'changed' : 'unchanged',
    metrics,
    regressions,
    improvements,
    commandSchemas,
    resourceSchemas,
    cmdHandler,
  };
};

export const buildSnapshotDiff = (beforeSnapshot, afterSnapshot) => {
  assertSnapshot(beforeSnapshot, 'before');
  assertSnapshot(afterSnapshot, 'after');

  const beforeSamples = indexSamples(beforeSnapshot);
  const afterSamples = indexSamples(afterSnapshot);
  const sampleNames = Array.from(new Set([
    ...beforeSamples.keys(),
    ...afterSamples.keys(),
  ])).sort();
  const samples = sampleNames.map(sampleName => (
    buildSampleSnapshotDiff(beforeSamples.get(sampleName), afterSamples.get(sampleName))
  ));
  const regressionCount = samples.reduce((total, sample) => total + sample.regressions.length, 0);
  const improvementCount = samples.reduce((total, sample) => total + sample.improvements.length, 0);

  return {
    schemaVersion: 1,
    kind: SCHEME_CORPUS_SNAPSHOT_DIFF_KIND,
    before: {
      sampleCount: beforeSnapshot.sampleCount,
      pass: beforeSnapshot.thresholdSummary?.pass,
    },
    after: {
      sampleCount: afterSnapshot.sampleCount,
      pass: afterSnapshot.thresholdSummary?.pass,
    },
    summary: {
      pass: regressionCount === 0,
      compared: samples.filter(sample => sample.status === 'changed' || sample.status === 'unchanged').length,
      added: samples.filter(sample => sample.status === 'added').length,
      removed: samples.filter(sample => sample.status === 'removed').length,
      changed: samples.filter(sample => sample.status === 'changed').length,
      unchanged: samples.filter(sample => sample.status === 'unchanged').length,
      regressions: regressionCount,
      improvements: improvementCount,
    },
    samples,
  };
};

const formatMarkdownValue = value => (
  String(value ?? '').replace(/\|/g, '\\|')
);

const formatMetric = metric => {
  if (!metric || metric.before === undefined || metric.after === undefined) {
    return metric?.after === undefined ? `${metric?.before ?? '-'} -> -` : `- -> ${metric.after}`;
  }
  return `${metric.before} -> ${metric.after} (${formatSignedDelta(metric.delta)})`;
};

const formatCmdHandler = cmdHandler => {
  if (!cmdHandler.before && !cmdHandler.after) return '未配置';
  const before = cmdHandler.beforePass === undefined ? '-' : (cmdHandler.beforePass ? 'PASS' : 'FAIL');
  const after = cmdHandler.afterPass === undefined ? '-' : (cmdHandler.afterPass ? 'PASS' : 'FAIL');
  return `${before} -> ${after}`;
};

export const formatSnapshotDiffMarkdown = diff => {
  const lines = [
    '# Scheme Corpus 质量趋势',
    '',
    `- 结果: ${diff.summary.pass ? 'PASS' : 'FAIL'}`,
    `- 对比样本: ${diff.summary.compared}`,
    `- 新增/删除: ${diff.summary.added}/${diff.summary.removed}`,
    `- 变化/不变: ${diff.summary.changed}/${diff.summary.unchanged}`,
    `- 退化/提升: ${diff.summary.regressions}/${diff.summary.improvements}`,
    '',
    '| 样本 | 状态 | 覆盖率 | CMD | CMD字段 | 资源字段 | 占位符 | 待检查 | 跳过 | 必需项失败 | cmdHandler | 风险 |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: |',
  ];

  diff.samples.forEach(sample => {
    lines.push([
      formatMarkdownValue(sample.sample),
      sample.status,
      formatMetric(sample.metrics.coverage),
      formatMetric(sample.metrics.cmdStructures),
      formatMetric(sample.metrics.nestedCommandFields),
      formatMetric(sample.metrics.nestedResourceFields),
      formatMetric(sample.metrics.runtimePlaceholders),
      formatMetric(sample.metrics.unresolved),
      formatMetric(sample.metrics.warnings),
      formatMetric(sample.metrics.requiredFailures),
      formatCmdHandler(sample.cmdHandler),
      sample.regressions.length,
    ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
  });

  const samplesWithRegressions = diff.samples.filter(sample => sample.regressions.length > 0);
  if (samplesWithRegressions.length > 0) {
    lines.push('', '## 退化明细', '');
    samplesWithRegressions.forEach(sample => {
      lines.push(`### ${formatMarkdownValue(sample.sample)}`, '');
      sample.regressions.forEach(regression => {
        lines.push(`- ${regression.message}: ${JSON.stringify(regression.before)} -> ${JSON.stringify(regression.after)}`);
      });
      lines.push('');
    });
  }

  const samplesWithImprovements = diff.samples.filter(sample => sample.improvements.length > 0);
  if (samplesWithImprovements.length > 0) {
    lines.push('', '## 提升明细', '');
    samplesWithImprovements.forEach(sample => {
      lines.push(`### ${formatMarkdownValue(sample.sample)}`, '');
      sample.improvements.forEach(improvement => {
        lines.push(`- ${improvement.message}: ${JSON.stringify(improvement.before)} -> ${JSON.stringify(improvement.after)}`);
      });
      lines.push('');
    });
  }

  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n')}\n`;
};

export const parseCliArgs = argv => {
  const options = {
    beforePath: undefined,
    afterPath: undefined,
    outputPath: undefined,
    summaryPath: undefined,
    strict: false,
  };
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--strict') {
      options.strict = true;
      continue;
    }
    if (arg === '--before') {
      const value = argv[index + 1];
      if (!value) throw new Error('--before 需要快照文件路径');
      options.beforePath = value;
      index += 1;
      continue;
    }
    if (arg === '--after') {
      const value = argv[index + 1];
      if (!value) throw new Error('--after 需要快照文件路径');
      options.afterPath = value;
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
    positional.push(arg);
  }

  if (!options.beforePath && positional[0]) options.beforePath = positional[0];
  if (!options.afterPath && positional[1]) options.afterPath = positional[1];
  if (positional.length > 2) throw new Error('最多只能指定 before 和 after 两个快照文件');
  if (!options.beforePath) throw new Error('缺少 --before 快照文件路径');
  if (!options.afterPath) throw new Error('缺少 --after 快照文件路径');

  return options;
};

const loadJsonFile = async filePath => (
  parseJsonInput(await readFile(path.resolve(process.cwd(), filePath), 'utf8'), path.basename(filePath))
);

const writeTextFile = async (filePath, text) => {
  const absolutePath = path.resolve(process.cwd(), filePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, text);
  return absolutePath;
};

const printUsage = () => {
  console.error('用法: npm run corpus:snapshot:diff -- --before before.json --after after.json [--strict] [--output diff.json] [--summary diff.md]');
  console.error(`默认 JSON 输出文件名建议: ${path.relative(process.cwd(), path.join(__dirname, '..', DEFAULT_OUTPUT_NAME))}`);
};

const runCli = async () => {
  const [, scriptPath, ...args] = process.argv;
  const isMain = scriptPath && import.meta.url === new URL(scriptPath, 'file:').href;
  if (!isMain) return;

  try {
    const options = parseCliArgs(args);
    const beforeSnapshot = await loadJsonFile(options.beforePath);
    const afterSnapshot = await loadJsonFile(options.afterPath);
    const diff = buildSnapshotDiff(beforeSnapshot, afterSnapshot);
    const diffJsonText = `${JSON.stringify(diff, null, 2)}\n`;
    process.stdout.write(diffJsonText);
    if (options.outputPath) {
      const outputPath = await writeTextFile(options.outputPath, diffJsonText);
      console.error(`已写入质量趋势 JSON: ${outputPath}`);
    }
    if (options.summaryPath) {
      const summaryPath = await writeTextFile(options.summaryPath, formatSnapshotDiffMarkdown(diff));
      console.error(`已写入质量趋势摘要: ${summaryPath}`);
    }
    if (options.strict && !diff.summary.pass) {
      console.error('corpus:snapshot:diff strict 检查失败:');
      diff.samples.forEach(sample => {
        sample.regressions.forEach(regression => {
          console.error(`- ${sample.sample}.${regression.key}: ${regression.message}`);
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
