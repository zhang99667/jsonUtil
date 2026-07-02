import fs from 'node:fs';
import path from 'node:path';
import { collectFrontendSourceFiles } from './chunkLoadRecoverySourceFiles.mjs';
import {
  getCallName,
  getNodeLine,
  isDynamicImportCall,
  nodeContains,
  ts,
} from './chunkLoadRecoveryCatchAst.mjs';

const RECOVERY_GUARD_CALL_NAMES = new Set(['performTransformAsync']);
const RECOVERY_GUARD_MEMBER_NAMES = new Set(['onLoadBackupModule', 'loadSummaryModule']);
const RECOVERY_DISPATCH_NAME = 'dispatchChunkLoadRecoveryEvent';

const toRelativePath = (rootDir, filePath) => path.relative(rootDir, filePath).split(path.sep).join('/');

export { collectFrontendSourceFiles } from './chunkLoadRecoverySourceFiles.mjs';

const collectLocalDynamicImportFunctions = (sourceFile) => {
  const names = new Set();

  sourceFile.forEachChild((node) => {
    if (ts.isFunctionDeclaration(node) && node.name && nodeContains(node, isDynamicImportCall)) {
      names.add(node.name.text);
      return;
    }

    if (!ts.isVariableStatement(node)) return;
    node.declarationList.declarations.forEach((declaration) => {
      if (ts.isIdentifier(declaration.name) && declaration.initializer && nodeContains(declaration.initializer, isDynamicImportCall)) {
        names.add(declaration.name.text);
      }
    });
  });

  return names;
};

const nodeContainsRecoveryTrigger = (node, localDynamicImportFunctions) => nodeContains(node, (candidate) => {
  if (!ts.isCallExpression(candidate)) return false;
  if (isDynamicImportCall(candidate)) return true;

  const callName = getCallName(candidate.expression);
  return Boolean(
    callName &&
    (
      localDynamicImportFunctions.has(callName) ||
      RECOVERY_GUARD_CALL_NAMES.has(callName) ||
      RECOVERY_GUARD_MEMBER_NAMES.has(callName)
    )
  );
});

const nodeContainsRecoveryDispatch = (node) => nodeContains(node, (candidate) => (
  ts.isCallExpression(candidate) &&
  getCallName(candidate.expression) === RECOVERY_DISPATCH_NAME
));

const isCatchMethodCall = (node) => (
  ts.isCallExpression(node) &&
  ts.isPropertyAccessExpression(node.expression) &&
  node.expression.name.text === 'catch'
);

const getCallbackBody = (callback) => {
  if (!callback) return null;
  if (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) return callback.body;
  return null;
};

export const auditChunkLoadRecoveryCatchesInSource = (file, sourceText, rootDir = process.cwd()) => {
  const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const localDynamicImportFunctions = collectLocalDynamicImportFunctions(sourceFile);
  const failures = [];
  const relativeFile = toRelativePath(rootDir, file);

  const addFailure = (node, kind) => failures.push({
    file: relativeFile,
    line: getNodeLine(sourceFile, node),
    kind,
    message: `手动懒加载失败 catch 缺少 ${RECOVERY_DISPATCH_NAME}(error) 恢复兜底`,
  });

  const visit = (node) => {
    if (ts.isTryStatement(node) && node.catchClause) {
      if (
        nodeContainsRecoveryTrigger(node.tryBlock, localDynamicImportFunctions) &&
        !nodeContainsRecoveryDispatch(node.catchClause.block)
      ) {
        addFailure(node.catchClause, 'try-catch');
      }
    }

    if (isCatchMethodCall(node)) {
      const catchTarget = node.expression.expression;
      const callbackBody = getCallbackBody(node.arguments[0]);
      if (
        nodeContainsRecoveryTrigger(catchTarget, localDynamicImportFunctions) &&
        (!callbackBody || !nodeContainsRecoveryDispatch(callbackBody))
      ) {
        addFailure(node.expression.name, 'promise-catch');
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return failures;
};

export const buildChunkLoadRecoveryCatchReport = (rootDir, options = {}) => {
  const sourceFiles = options.files ?? collectFrontendSourceFiles(rootDir, options.sourceDir);
  const failures = sourceFiles.flatMap(file => (
    auditChunkLoadRecoveryCatchesInSource(file, fs.readFileSync(file, 'utf8'), rootDir)
  ));

  return {
    checkedFiles: sourceFiles.map(file => toRelativePath(rootDir, file)),
    failures,
  };
};
