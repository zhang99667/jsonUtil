#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import process from 'node:process';

const SAMPLE_EXPORT_KIND = 'json-helper-transform-issue-samples';

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

export const buildRegressionTemplate = sampleExport => {
  const exportData = typeof sampleExport === 'string'
    ? parseIssueSampleExport(sampleExport)
    : assertIssueSampleExport(sampleExport);
  const samples = exportData.samples.map(pickSampleFields);

  if (samples.length === 0) {
    throw new Error('样本 JSON 中没有可转换的 samples');
  }

  return [
    "import { describe, it } from 'vitest';",
    '',
    '// 由深度解析报告「复制样本 JSON」生成；把 it.todo 改成 it 后补充解析断言。',
    `const issueSamples = ${JSON.stringify(samples, null, 2)} as const;`,
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
  console.error('用法: npm run samples:to-regression -- <sample-json-file>');
  console.error('也可通过 stdin 输入: pbpaste | npm run samples:to-regression');
};

const runCli = async () => {
  const [, scriptPath, inputPath] = process.argv;
  const isMain = scriptPath && import.meta.url === new URL(scriptPath, 'file:').href;
  if (!isMain) return;

  try {
    if (!inputPath && process.stdin.isTTY) {
      printUsage();
      process.exitCode = 1;
      return;
    }

    const inputText = inputPath
      ? await readFile(inputPath, 'utf8')
      : await readStdin();
    process.stdout.write(buildRegressionTemplate(inputText));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
};

await runCli();
