#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import process from 'node:process';

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

const readStdin = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
};

export const extractCmdStructurePair = value => {
  if (!isRecord(value) || !Object.prototype.hasOwnProperty.call(value, 'actual') || !Object.prototype.hasOwnProperty.call(value, 'expected')) {
    throw new Error('单文件或 stdin 输入必须是包含 actual 和 expected 的 JSON 对象');
  }

  return {
    actual: value.actual,
    expected: value.expected,
  };
};

const appendPathKey = (path, key) => (
  /^[A-Za-z_$][\w$]*$/.test(key)
    ? `${path}.${key}`
    : `${path}[${JSON.stringify(key)}]`
);

const findCmdStructure = value => {
  if (!isRecord(value)) return null;

  if (isRecord(value.result)) {
    const result = findCmdStructure(value.result);
    if (result) return result;
  }

  if (isRecord(value.data)) {
    const result = findCmdStructure(value.data);
    if (result) return result;
  }

  if (Object.prototype.hasOwnProperty.call(value, 'cmdParams')) {
    return {
      cmdSchema: typeof value.cmdSchema === 'string' ? value.cmdSchema : undefined,
      cmdParams: value.cmdParams,
      source: typeof value.source === 'string' ? value.source : undefined,
    };
  }

  return null;
};

export const normalizeCmdStructure = value => {
  const structure = findCmdStructure(value);
  if (structure) return structure;

  return {
    cmdSchema: undefined,
    cmdParams: value,
    source: undefined,
  };
};

const collectValueMap = (value, path = '$') => {
  const rows = new Map();

  if (Array.isArray(value)) {
    rows.set(path, { type: 'array', value });
    value.forEach((item, index) => {
      collectValueMap(item, `${path}[${index}]`).forEach((row, rowPath) => {
        rows.set(rowPath, row);
      });
    });
    return rows;
  }

  if (isRecord(value)) {
    rows.set(path, { type: 'object', value });
    Object.entries(value).forEach(([key, item]) => {
      collectValueMap(item, appendPathKey(path, key)).forEach((row, rowPath) => {
        rows.set(rowPath, row);
      });
    });
    return rows;
  }

  rows.set(path, {
    type: value === null ? 'null' : typeof value,
    value,
  });
  return rows;
};

const stableStringify = value => {
  if (!isRecord(value) && !Array.isArray(value)) {
    return JSON.stringify(value);
  }

  const normalize = item => {
    if (Array.isArray(item)) return item.map(normalize);
    if (!isRecord(item)) return item;

    return Object.keys(item).sort().reduce((result, key) => {
      result[key] = normalize(item[key]);
      return result;
    }, {});
  };

  return JSON.stringify(normalize(value));
};

const compareRows = (actualRows, expectedRows) => {
  const missingPaths = [];
  const extraPaths = [];
  const valueDiffs = [];

  expectedRows.forEach((expectedRow, path) => {
    const actualRow = actualRows.get(path);
    if (!actualRow) {
      missingPaths.push(path);
      return;
    }

    if (actualRow.type !== expectedRow.type) {
      valueDiffs.push({
        path,
        actual: actualRow.value,
        expected: expectedRow.value,
      });
      return;
    }

    if (actualRow.type === 'object' || actualRow.type === 'array') {
      return;
    }

    if (stableStringify(actualRow.value) !== stableStringify(expectedRow.value)) {
      valueDiffs.push({
        path,
        actual: actualRow.value,
        expected: expectedRow.value,
      });
    }
  });

  actualRows.forEach((_actualRow, path) => {
    if (!expectedRows.has(path)) {
      extraPaths.push(path);
    }
  });

  return { missingPaths, extraPaths, valueDiffs };
};

export const diffCmdStructures = (actualInput, expectedInput) => {
  const actual = normalizeCmdStructure(actualInput);
  const expected = normalizeCmdStructure(expectedInput);
  const schemaDiff = actual.cmdSchema !== expected.cmdSchema
    ? { actual: actual.cmdSchema, expected: expected.cmdSchema }
    : null;
  const sourceDiff = actual.source && expected.source && actual.source !== expected.source
    ? { actual: actual.source, expected: expected.source }
    : null;
  const paramDiff = compareRows(
    collectValueMap(actual.cmdParams),
    collectValueMap(expected.cmdParams)
  );

  return {
    schemaDiff,
    sourceDiff,
    ...paramDiff,
    hasDifferences: Boolean(
      schemaDiff ||
      sourceDiff ||
      paramDiff.missingPaths.length ||
      paramDiff.extraPaths.length ||
      paramDiff.valueDiffs.length
    ),
  };
};

const formatValue = value => {
  const text = stableStringify(value);
  return text && text.length > 160 ? `${text.slice(0, 160)}...` : text;
};

export const formatCmdStructureDiff = diff => {
  const lines = ['CMD 结构差异报告'];

  if (!diff.hasDifferences) {
    lines.push('- 结构一致');
    return lines.join('\n');
  }

  if (diff.schemaDiff) {
    lines.push(`- cmdSchema 不一致: actual=${diff.schemaDiff.actual || '(空)'} expected=${diff.schemaDiff.expected || '(空)'}`);
  }

  if (diff.sourceDiff) {
    lines.push('- source 不一致');
    lines.push(`  actual: ${diff.sourceDiff.actual}`);
    lines.push(`  expected: ${diff.sourceDiff.expected}`);
  }

  if (diff.missingPaths.length > 0) {
    lines.push(`- 缺失路径 ${diff.missingPaths.length} 个:`);
    diff.missingPaths.slice(0, 20).forEach(path => lines.push(`  - ${path}`));
    if (diff.missingPaths.length > 20) lines.push(`  - ... 还有 ${diff.missingPaths.length - 20} 个`);
  }

  if (diff.extraPaths.length > 0) {
    lines.push(`- 额外路径 ${diff.extraPaths.length} 个:`);
    diff.extraPaths.slice(0, 20).forEach(path => lines.push(`  - ${path}`));
    if (diff.extraPaths.length > 20) lines.push(`  - ... 还有 ${diff.extraPaths.length - 20} 个`);
  }

  if (diff.valueDiffs.length > 0) {
    lines.push(`- 值不一致 ${diff.valueDiffs.length} 个:`);
    diff.valueDiffs.slice(0, 20).forEach(item => {
      lines.push(`  - ${item.path}: actual=${formatValue(item.actual)} expected=${formatValue(item.expected)}`);
    });
    if (diff.valueDiffs.length > 20) lines.push(`  - ... 还有 ${diff.valueDiffs.length - 20} 个`);
  }

  return lines.join('\n');
};

const printUsage = () => {
  console.error('用法: npm run cmd:diff -- <actual-json-file> <expected-json-file>');
  console.error('也可输入单个对比包: npm run cmd:diff -- <pair-json-file>');
  console.error('也可通过 stdin 输入对比包: pbpaste | npm run cmd:diff -- --stdin');
  console.error('对比包格式: {"actual": {...}, "expected": {...}}');
  console.error('actual 通常为本工具复制的 CMD 结构，expected 通常为内部 cmdHandler 导出的 JSON');
};

const parseCliArgs = argv => {
  const options = { fromStdin: false };
  const paths = [];

  argv.forEach(arg => {
    if (arg === '--stdin') {
      options.fromStdin = true;
      return;
    }

    if (arg.startsWith('-')) {
      throw new Error(`未知参数: ${arg}`);
    }

    paths.push(arg);
  });

  if (options.fromStdin && paths.length > 0) {
    throw new Error('--stdin 不能和文件路径同时使用');
  }

  if (paths.length > 2) {
    throw new Error('最多只能输入两个 JSON 文件');
  }

  return { options, paths };
};

const readComparisonInputs = async (paths, options) => {
  if (options.fromStdin || (paths.length === 0 && !process.stdin.isTTY)) {
    const pair = extractCmdStructurePair(parseJsonInput(await readStdin(), 'stdin'));
    return pair;
  }

  if (paths.length === 1) {
    const pair = extractCmdStructurePair(parseJsonInput(await readFile(paths[0], 'utf8'), 'pair'));
    return pair;
  }

  if (paths.length === 2) {
    const [actualText, expectedText] = await Promise.all([
      readFile(paths[0], 'utf8'),
      readFile(paths[1], 'utf8'),
    ]);

    return {
      actual: parseJsonInput(actualText, 'actual'),
      expected: parseJsonInput(expectedText, 'expected'),
    };
  }

  return null;
};

const runCli = async () => {
  const [, scriptPath, ...args] = process.argv;
  const isMain = scriptPath && import.meta.url === new URL(scriptPath, 'file:').href;
  if (!isMain) return;

  try {
    const { options, paths } = parseCliArgs(args);
    const inputs = await readComparisonInputs(paths, options);
    if (!inputs) {
      printUsage();
      process.exitCode = 1;
      return;
    }

    const diff = diffCmdStructures(inputs.actual, inputs.expected);

    process.stdout.write(`${formatCmdStructureDiff(diff)}\n`);
    process.exitCode = diff.hasDifferences ? 2 : 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
};

await runCli();
