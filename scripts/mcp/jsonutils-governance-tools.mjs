// 常驻 MCP 只保留工具 schema、输入校验与 fresh worker 调度。

import { jsonutilsGovernanceTools } from './jsonutils-governance-tool-definitions.mjs';
import { assertJsonutilsGovernanceToolInput } from './jsonutils-governance-tool-input.mjs';
import { runJsonutilsGovernanceToolWorker } from './jsonutils-governance-tool-worker-client.mjs';

export { runJsonutilsGovernanceToolWorker };

export const listJsonutilsGovernanceTools = () => ({ tools: jsonutilsGovernanceTools });

export const callJsonutilsGovernanceTool = async (
  name,
  args = {},
  runToolWorker = runJsonutilsGovernanceToolWorker,
  { signal } = {},
) => {
  assertJsonutilsGovernanceToolInput(name, args);
  return runToolWorker({ name, args }, { signal });
};
