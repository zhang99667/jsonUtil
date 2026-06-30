export const infraDeployCheckerMaintainabilityBudgets = [
  { file: 'scripts/ci/check-deploy-shell-syntax.mjs', maxLines: 30, reason: '部署脚本语法检查 CLI 应只负责输出和退出码' },
  { file: 'scripts/ci/deployShellSyntaxCheck.mjs', maxLines: 35, reason: '部署脚本语法检查核心应只合并 shell 文件和 workflow run 检查报告' },
  { file: 'scripts/ci/deployShellFileChecks.mjs', maxLines: 45, reason: '部署 shell 文件检查应只负责文件存在、外层 bash -n 和 heredoc 分发' },
  { file: 'scripts/ci/deployWorkflowRunChecks.mjs', maxLines: 40, reason: 'Workflow run 检查应只负责 workflow 文件存在、run 块遍历和 bash -n 分发' },
  { file: 'scripts/ci/deployShellSyntaxRunner.mjs', maxLines: 35, reason: '部署脚本 bash -n runner 应只负责执行和失败格式化' },
  { file: 'scripts/ci/deployShellTargets.mjs', maxLines: 25, reason: '部署脚本检查目标列表应只维护 shell 文件和 workflow 文件清单' },
  { file: 'scripts/ci/deployShellHeredocs.mjs', maxLines: 45, reason: '部署脚本 heredoc 提取应只识别脚本 marker 和正文边界' },
  { file: 'scripts/ci/githubWorkflowRunBlocks.mjs', maxLines: 60, reason: 'GitHub workflow run 提取应只处理 inline run、块状 run 和 Actions 表达式占位' },
];
