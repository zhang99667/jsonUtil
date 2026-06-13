#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import process from 'node:process';

const SAMPLE_EXPORT_KIND = 'json-helper-transform-issue-samples';
const SENSITIVE_KEYWORDS = [
  'access_token',
  'refresh_token',
  'authorization',
  'android_id',
  'device_id',
  'baiduid',
  'baidu_id',
  'password',
  'passwd',
  'session',
  'cookie',
  'secret',
  'token',
  'sign',
  'imei',
  'oaid',
  'idfa',
  'cuid',
];

const isRecord = value => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const pickSampleFields = sample => {
  const result = {
    type: sample.type,
    path: sample.path,
  };

  [
    'sourceLabel',
    'reasonLabel',
    'nextAction',
    'message',
    'detectedType',
    'reasonLevel',
    'length',
    'limit',
    'value',
    'sourcePath',
    'warningType',
    'originalValue',
  ].forEach(key => {
    if (sample[key] !== undefined) {
      result[key] = sample[key];
    }
  });

  return result;
};

const decodeForSensitiveSearch = value => {
  let current = value;
  for (let index = 0; index < 2; index++) {
    try {
      const decoded = decodeURIComponent(current.replace(/\+/g, ' '));
      if (decoded === current) break;
      current = decoded;
    } catch {
      break;
    }
  }
  return current;
};

const includesSensitiveKeyword = (text, keyword) => {
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(^|[^a-z0-9])${escapedKeyword}([^a-z0-9]|$)`, 'i');
  return pattern.test(text);
};

const collectSensitiveKeywords = sample => {
  const searchText = [
    sample.path,
    sample.sourcePath,
    sample.sourceLabel,
    sample.value,
    sample.originalValue,
    typeof sample.originalValue === 'string' ? decodeForSensitiveSearch(sample.originalValue) : '',
  ].filter(value => typeof value === 'string' && value).join('\n');

  return SENSITIVE_KEYWORDS.filter(keyword => includesSensitiveKeyword(searchText, keyword));
};

const formatSensitiveHint = hint => `${hint.path}(${hint.keywords.join('/')})`;

const redactSensitiveSampleValues = samples => (
  samples.map(sample => {
    const keywords = collectSensitiveKeywords(sample);
    if (keywords.length === 0 || sample.originalValue === undefined) return sample;

    return {
      ...sample,
      originalValue: `[REDACTED: ${keywords.join('/')}]`,
      redactionHint: `原始值已脱敏，命中: ${keywords.join('/')}`,
    };
  })
);

export const findSensitiveSampleHints = samples => (
  samples.flatMap(sample => {
    const keywords = collectSensitiveKeywords(sample);
    if (keywords.length === 0) return [];

    return [{
      path: sample.path,
      keywords,
    }];
  })
);

const assertIssueSampleExport = value => {
  if (!isRecord(value) || value.kind !== SAMPLE_EXPORT_KIND || !Array.isArray(value.samples)) {
    throw new Error('输入不是有效的深度解析问题样本 JSON');
  }

  return value;
};

export const parseIssueSampleExport = text => {
  try {
    return assertIssueSampleExport(JSON.parse(text));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`样本 JSON 解析失败: ${error.message}`);
    }

    throw error;
  }
};

export const buildRegressionTemplate = (sampleExport, options = {}) => {
  const exportData = typeof sampleExport === 'string'
    ? parseIssueSampleExport(sampleExport)
    : assertIssueSampleExport(sampleExport);
  const samples = exportData.samples.map(pickSampleFields);

  if (samples.length === 0) {
    throw new Error('样本 JSON 中没有可转换的 samples');
  }

  const sensitiveHints = findSensitiveSampleHints(samples);
  const outputSamples = options.redactSensitiveValues
    ? redactSensitiveSampleValues(samples)
    : samples;
  const hasRedactedValues = outputSamples.some(sample => sample.redactionHint);
  const sensitiveHintLines = sensitiveHints.length > 0
    ? (hasRedactedValues
        ? [
            '// 注意: 检测到样本可能包含 token/sign/cookie/设备标识等敏感字段。',
            `// 已按 --redact 脱敏命中的 originalValue，当前命中: ${sensitiveHints.slice(0, 5).map(formatSensitiveHint).join('；')}${sensitiveHints.length > 5 ? '；...' : ''}`,
            '// 补断言前请用脱敏后的等价样本还原结构。',
            '',
          ]
        : [
            '// 注意: 检测到样本可能包含 token/sign/cookie/设备标识等敏感字段。',
            `// 提交前请先脱敏 originalValue，当前命中: ${sensitiveHints.slice(0, 5).map(formatSensitiveHint).join('；')}${sensitiveHints.length > 5 ? '；...' : ''}`,
            '',
          ])
    : [];

  return [
    "import { describe, it } from 'vitest';",
    '',
    '// 由深度解析报告「复制样本 JSON」生成；把 it.todo 改成 it 后补充解析断言。',
    ...sensitiveHintLines,
    `const issueSamples = ${JSON.stringify(outputSamples, null, 2)} as const;`,
    '',
    "describe('深度解析问题样本回归', () => {",
    '  issueSamples.forEach(sample => {',
    '    it.todo(`${sample.type} ${sample.path} · ${sample.reasonLabel}`);',
    '  });',
    '});',
    '',
  ].join('\n');
};

const readStdin = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
};

const printUsage = () => {
  console.error('用法: npm run samples:to-regression -- [--redact] <sample-json-file>');
  console.error('也可通过 stdin 输入: pbpaste | npm run samples:to-regression -- --redact');
};

const parseCliArgs = argv => {
  const options = { redactSensitiveValues: false };
  const inputPaths = [];

  argv.forEach(arg => {
    if (arg === '--redact') {
      options.redactSensitiveValues = true;
      return;
    }

    if (arg.startsWith('-')) {
      throw new Error(`未知参数: ${arg}`);
    }

    inputPaths.push(arg);
  });

  if (inputPaths.length > 1) {
    throw new Error('一次只能输入一个样本 JSON 文件');
  }

  return { inputPath: inputPaths[0], options };
};

const runCli = async () => {
  const [, scriptPath, ...args] = process.argv;
  const isMain = scriptPath && import.meta.url === new URL(scriptPath, 'file:').href;
  if (!isMain) return;

  try {
    const { inputPath, options } = parseCliArgs(args);
    if (!inputPath && process.stdin.isTTY) {
      printUsage();
      process.exitCode = 1;
      return;
    }

    const inputText = inputPath
      ? await readFile(inputPath, 'utf8')
      : await readStdin();
    process.stdout.write(buildRegressionTemplate(inputText, options));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
};

await runCli();
