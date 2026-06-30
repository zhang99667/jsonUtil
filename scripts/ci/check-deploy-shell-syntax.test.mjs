import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { checkDeployShellSyntax } from './deployShellSyntaxCheck.mjs';

const withTempRoot = (run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-shell-syntax-'));
  try {
    return run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

const writeFixtureFile = (rootDir, file, content) => {
  const filePath = path.join(rootDir, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

const fixtureRunner = (_command, args, options = {}) => {
  const script = args[1] ? fs.readFileSync(args[1], 'utf8') : '';
  if (script.includes('OUTER_BROKEN_SYNTAX')) {
    return { status: 2, stderr: 'syntax error near OUTER_BROKEN_SYNTAX\n', stdout: '' };
  }
  if (String(options.input ?? '').includes('BROKEN_HEREDOC_SYNTAX')) {
    return { status: 2, stderr: 'syntax error near BROKEN_HEREDOC_SYNTAX\n', stdout: '' };
  }
  return { status: 0, stderr: '', stdout: '' };
};

test('部署 Shell 语法检查通过时返回已检查文件', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'scripts/deploy/deploy.sh', '#!/usr/bin/env bash\nset -e\n');

    const report = checkDeployShellSyntax(rootDir, {
      files: ['scripts/deploy/deploy.sh'],
      workflowFiles: [],
      runner: fixtureRunner,
    });

    assert.deepEqual(report, {
      checkedFiles: ['scripts/deploy/deploy.sh'],
      checkedHeredocs: [],
      checkedWorkflowRuns: [],
      failures: [],
    });
  });
});

test('部署 Shell 语法检查会报告 bash -n 失败详情', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'scripts/deploy/deploy.sh', 'OUTER_BROKEN_SYNTAX\n');

    const report = checkDeployShellSyntax(rootDir, {
      files: ['scripts/deploy/deploy.sh'],
      workflowFiles: [],
      runner: fixtureRunner,
    });

    assert.deepEqual(report.failures, [
      'scripts/deploy/deploy.sh: bash -n 失败: syntax error near OUTER_BROKEN_SYNTAX',
    ]);
  });
});

test('部署 Shell 语法检查会单独校验脚本 heredoc', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'scripts/deploy/deploy.sh', [
      'ssh host <<\'REMOTE_SCRIPT\'',
      'BROKEN_HEREDOC_SYNTAX',
      'REMOTE_SCRIPT',
    ].join('\n'));

    const report = checkDeployShellSyntax(rootDir, {
      files: ['scripts/deploy/deploy.sh'],
      workflowFiles: [],
      runner: fixtureRunner,
    });

    assert.deepEqual(report.checkedHeredocs, ['scripts/deploy/deploy.sh:REMOTE_SCRIPT:2']);
    assert.deepEqual(report.failures, [
      'scripts/deploy/deploy.sh:REMOTE_SCRIPT:2: bash -n 失败: syntax error near BROKEN_HEREDOC_SYNTAX',
    ]);
  });
});

test('部署 Shell 语法检查会报告缺失脚本', () => {
  withTempRoot((rootDir) => {
    const report = checkDeployShellSyntax(rootDir, {
      files: ['scripts/deploy/missing.sh'],
      workflowFiles: [],
      runner: fixtureRunner,
    });

    assert.deepEqual(report, {
      checkedFiles: [],
      checkedHeredocs: [],
      checkedWorkflowRuns: [],
      failures: ['scripts/deploy/missing.sh: 文件不存在'],
    });
  });
});

test('部署 Shell 语法检查会单独校验 workflow run 块', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.github/workflows/ci.yml', [
      'steps:',
      '  - name: Test',
      '    run: |',
      '      BROKEN_HEREDOC_SYNTAX',
    ].join('\n'));

    const report = checkDeployShellSyntax(rootDir, {
      files: [],
      workflowFiles: ['.github/workflows/ci.yml'],
      runner: fixtureRunner,
    });

    assert.deepEqual(report.checkedWorkflowRuns, ['.github/workflows/ci.yml:run:4']);
    assert.deepEqual(report.failures, [
      '.github/workflows/ci.yml:run:4: bash -n 失败: syntax error near BROKEN_HEREDOC_SYNTAX',
    ]);
  });
});

test('部署 Shell 语法检查会报告缺失 workflow 文件', () => {
  withTempRoot((rootDir) => {
    const report = checkDeployShellSyntax(rootDir, {
      files: [],
      workflowFiles: ['.github/workflows/missing.yml'],
      runner: fixtureRunner,
    });

    assert.deepEqual(report, {
      checkedFiles: [],
      checkedHeredocs: [],
      checkedWorkflowRuns: [],
      failures: ['.github/workflows/missing.yml: 文件不存在'],
    });
  });
});

test('部署 Shell 语法检查会在 orchestrator 层归一化 workflow 表达式', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.github/workflows/ci.yml', [
      'steps:',
      '  - name: Test',
      '    run: echo "${{ inputs.host }}"',
    ].join('\n'));

    const report = checkDeployShellSyntax(rootDir, {
      files: [],
      workflowFiles: ['.github/workflows/ci.yml'],
      runner: (_command, _args, options = {}) => {
        if (String(options.input ?? '').includes('${{')) {
          return { status: 2, stderr: 'un-normalized github expression\n', stdout: '' };
        }
        return { status: 0, stderr: '', stdout: '' };
      },
    });

    assert.deepEqual(report, {
      checkedFiles: [],
      checkedHeredocs: [],
      checkedWorkflowRuns: ['.github/workflows/ci.yml:run:3'],
      failures: [],
    });
  });
});
