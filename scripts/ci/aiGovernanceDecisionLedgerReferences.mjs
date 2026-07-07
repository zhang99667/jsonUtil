export const extractBacktickReferences = text => [...text.matchAll(/`([^`]+)`/g)].map(match => match[1]);

export const extractExecutableCommands = text => extractBacktickReferences(text)
  .filter(value => /^(?:node|npm|git)\s+/.test(value));

export const extractNodeCommandPaths = text => extractExecutableCommands(text)
  .map(command => command.match(/^node(?:\s+--test)?\s+([^\s]+)/)?.[1])
  .filter(Boolean);

export const extractNodeRegressionTestCommandPaths = text => extractExecutableCommands(text)
  .map(command => command.match(/^node\s+--test\s+([^\s]+\.test\.mjs)(?:\s+.*)?$/)?.[1])
  .filter(Boolean);
