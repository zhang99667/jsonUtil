import { createRequire } from 'node:module';

const require = createRequire(new URL('../../frontend/package.json', import.meta.url));

export const ts = require('typescript');

export const nodeContains = (node, predicate) => {
  if (predicate(node)) return true;

  let matched = false;
  node.forEachChild((child) => {
    if (!matched && nodeContains(child, predicate)) matched = true;
  });
  return matched;
};

export const isDynamicImportCall = (node) => (
  ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword
);

export const getCallName = (expression) => {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  return null;
};

export const getNodeLine = (sourceFile, node) => (
  sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
);
