export const extractBacktickReferences = text => [...text.matchAll(/`([^`]+)`/g)].map(match => match[1]);

export const extractExecutableCommands = text => extractBacktickReferences(text)
  .filter(value => /^(?:node|npm|git)\s+/.test(value));

const extractNodeCommandPathTokens = (command, onlyTest = false) => {
  const tokens = command.trim().split(/\s+/);
  if (tokens[0] !== 'node' || !tokens[1]) return [];
  if (tokens[1] !== '--test') return onlyTest ? [] : [tokens[1]];
  const paths = tokens.slice(2).filter(token => token.endsWith('.mjs'));
  return onlyTest ? paths.filter(file => file.endsWith('.test.mjs')) : paths;
};

export const extractNodeCommandPaths = text => extractExecutableCommands(text).flatMap(extractNodeCommandPathTokens);

export const extractNodeRegressionTestCommandPaths = text => extractExecutableCommands(text)
  .flatMap(command => extractNodeCommandPathTokens(command, true));

export const isCiCoveredNodeRegressionTestPath = file => /^scripts\/ci\/[^/]+\.test\.mjs$/.test(file);
