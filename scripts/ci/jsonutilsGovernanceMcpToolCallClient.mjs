import { request } from './mcpContentLengthStdioClient.mjs';

export const callGovernanceMcpTool = async (child, readFrame, id, name, args, timeoutMs = 5000) => {
  const response = await request(child, readFrame, id, 'tools/call', { name, arguments: args }, timeoutMs);
  return JSON.parse(response.result.content[0].text);
};
