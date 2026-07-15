import { request } from './mcpLineDelimitedStdioClient.mjs';

export const callGovernanceMcpTool = async (child, readMessage, id, name, args, timeoutMs = 5000) => {
  const response = await request(child, readMessage, id, 'tools/call', { name, arguments: args }, timeoutMs);
  return JSON.parse(response.result.content[0].text);
};
