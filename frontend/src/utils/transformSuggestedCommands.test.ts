import { describe, expect, it } from 'vitest';
import {
  buildArchiveSuggestedCommands,
  buildCmdComparisonSuggestedCommands,
  buildIssueSampleSuggestedCommands,
  uniqueSuggestedCommands,
} from './transformSuggestedCommands';

describe('transformSuggestedCommands', () => {
  it('生成 CMD 对比建议命令', () => {
    expect(buildCmdComparisonSuggestedCommands()).toEqual([
      {
        id: 'cmd-diff-stdin',
        label: '对比 actual/expected',
        command: 'pbpaste | npm run cmd:diff -- --stdin',
        description: '复制当前对比包后直接运行，输出 cmdHandler 结构差异。',
      },
      {
        id: 'cmd-diff-stdin-ignore-extra',
        label: '忽略 actual 额外路径对比',
        command: 'pbpaste | npm run cmd:diff -- --stdin --ignore-extra',
        description: 'expected 只保存稳定子集时使用，避免 actual 额外展开字段造成噪音。',
      },
    ]);
  });

  it('生成问题样本和归档建议命令', () => {
    expect(buildIssueSampleSuggestedCommands().map(command => command.id)).toEqual([
      'issue-samples-to-regression-stdin',
    ]);
    expect(buildArchiveSuggestedCommands().map(command => command.command)).toEqual([
      'npm run samples:to-regression -- --redact <issue-samples.json>',
      'npm run corpus:snapshot:check',
    ]);
  });

  it('按 id 去重并保留后出现的命令内容', () => {
    expect(uniqueSuggestedCommands([
      {
        id: 'same',
        label: '旧',
        command: 'old',
        description: '旧命令',
      },
      {
        id: 'other',
        label: '其他',
        command: 'other',
        description: '其他命令',
      },
      {
        id: 'same',
        label: '新',
        command: 'new',
        description: '新命令',
      },
    ])).toEqual([
      {
        id: 'same',
        label: '新',
        command: 'new',
        description: '新命令',
      },
      {
        id: 'other',
        label: '其他',
        command: 'other',
        description: '其他命令',
      },
    ]);
  });
});
