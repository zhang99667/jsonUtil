export interface TransformSuggestedCommand {
  id: string;
  label: string;
  command: string;
  description: string;
}

const CMD_DIFF_STDIN_COMMAND = 'pbpaste | npm run cmd:diff -- --stdin';
const CMD_DIFF_STDIN_IGNORE_EXTRA_COMMAND = 'pbpaste | npm run cmd:diff -- --stdin --ignore-extra';
const ISSUE_SAMPLES_TO_REGRESSION_STDIN_COMMAND = 'pbpaste | npm run samples:to-regression -- --redact';
const ISSUE_SAMPLES_TO_REGRESSION_FILE_COMMAND = 'npm run samples:to-regression -- --redact <issue-samples.json>';
const CORPUS_SNAPSHOT_CHECK_COMMAND = 'npm run corpus:snapshot:check';

export const buildCmdComparisonSuggestedCommands = (): TransformSuggestedCommand[] => [
  {
    id: 'cmd-diff-stdin',
    label: '对比 actual/expected',
    command: CMD_DIFF_STDIN_COMMAND,
    description: '复制当前对比包后直接运行，输出 cmdHandler 结构差异。',
  },
  {
    id: 'cmd-diff-stdin-ignore-extra',
    label: '忽略 actual 额外路径对比',
    command: CMD_DIFF_STDIN_IGNORE_EXTRA_COMMAND,
    description: 'expected 只保存稳定子集时使用，避免 actual 额外展开字段造成噪音。',
  },
];

export const buildIssueSampleSuggestedCommands = (): TransformSuggestedCommand[] => [
  {
    id: 'issue-samples-to-regression-stdin',
    label: '生成回归测试模板',
    command: ISSUE_SAMPLES_TO_REGRESSION_STDIN_COMMAND,
    description: '复制问题样本 JSON 后直接运行，输出可补断言的 Vitest 模板。',
  },
];

export const buildArchiveSuggestedCommands = (): TransformSuggestedCommand[] => [
  {
    id: 'issue-samples-to-regression-file',
    label: '沉淀问题样本回归',
    command: ISSUE_SAMPLES_TO_REGRESSION_FILE_COMMAND,
    description: '先将 artifacts.issueSamples 保存为 issue-samples.json，再生成可补断言的回归测试模板。',
  },
  {
    id: 'corpus-snapshot-check',
    label: '校验 corpus 质量基线',
    command: CORPUS_SNAPSHOT_CHECK_COMMAND,
    description: '按 recommendedFiles 补齐脱敏 response、expected snapshot 和 cmdHandler expected 后运行。',
  },
];

export const uniqueSuggestedCommands = (
  commands: TransformSuggestedCommand[]
): TransformSuggestedCommand[] => (
  Array.from(new Map(commands.map(command => [command.id, command])).values())
);
