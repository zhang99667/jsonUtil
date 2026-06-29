import type { CmdStructureDiffContext } from './cmdStructureDiff';
import { collapseCmdStructureDescendantPaths } from './cmdStructurePathBranches';

export const formatCmdStructureSourceValue = (value?: string): string => {
  if (!value) return '(空)';

  return value.length > 240 ? `${value.slice(0, 240)}...` : value;
};

const getContextToolVersionLabel = (context: CmdStructureDiffContext): string => {
  const explicitVersionLabel = context.toolVersionLabel?.trim();
  if (explicitVersionLabel) return explicitVersionLabel;

  const versionLabel = context.tool?.versionLabel?.trim();
  if (versionLabel) return versionLabel;

  const version = context.tool?.version?.trim();
  if (!version) return '';

  return version.startsWith('v') ? version : `v${version}`;
};

export const appendCmdStructureDiffContextLines = (
  lines: string[],
  context: CmdStructureDiffContext
) => {
  const toolVersionLabel = getContextToolVersionLabel(context);
  if (toolVersionLabel) lines.push(`工具版本: ${toolVersionLabel}`);
  if (context.path) lines.push(`对比路径: ${context.path}`);
  if (context.sourceLabel) lines.push(`业务字段: ${context.sourceLabel}`);
  if (context.modeLabel) lines.push(`对比模式: ${context.modeLabel}`);
};

export const appendCmdStructurePathDiffLines = (
  lines: string[],
  title: string,
  paths: string[]
) => {
  const collapsedPaths = collapseCmdStructureDescendantPaths(paths);
  const collapsedLabel = collapsedPaths.length < paths.length
    ? `（折叠为 ${collapsedPaths.length} 个分支）`
    : '';
  lines.push(`- ${title} ${paths.length} 个${collapsedLabel}:`);
  collapsedPaths.slice(0, 20).forEach(path => lines.push(`  - ${path}`));
  if (collapsedPaths.length > 20) lines.push(`  - ... 还有 ${collapsedPaths.length - 20} 个分支`);
};
