#!/usr/bin/env node
// 校验后端 Controller 暴露的 API 是否都写入权限矩阵文档。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const controllerDir = path.join(rootDir, 'backend/src/main/java/com/jsonhelper/backend/controller');
const matrixFile = path.join(rootDir, 'docs/BACKEND-API-MATRIX.md');

const httpMethods = {
  GetMapping: 'GET',
  PostMapping: 'POST',
  PutMapping: 'PUT',
  DeleteMapping: 'DELETE',
  PatchMapping: 'PATCH',
};

const normalizePath = (...parts) => {
  const joined = parts
    .filter(Boolean)
    .join('/')
    .replace(/\/+/g, '/');
  const withLeadingSlash = joined.startsWith('/') ? joined : `/${joined}`;
  return withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/$/, '') : withLeadingSlash;
};

const extractMappingPath = (annotationArguments = '') => {
  const directMatch = annotationArguments.match(/^\s*"([^"]*)"/);
  if (directMatch) return directMatch[1];

  const valueMatch = annotationArguments.match(/\b(?:value|path)\s*=\s*"([^"]*)"/);
  return valueMatch ? valueMatch[1] : '';
};

const listControllerFiles = () => fs.readdirSync(controllerDir)
  .filter(fileName => fileName.endsWith('.java'))
  .map(fileName => path.join(controllerDir, fileName))
  .sort();

const collectControllerEndpoints = () => {
  const endpoints = [];
  const methodPattern = /@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping)(?:\(([^)]*)\))?/g;

  for (const filePath of listControllerFiles()) {
    const source = fs.readFileSync(filePath, 'utf8');
    const classPath = extractMappingPath(source.match(/@RequestMapping\(([^)]*)\)/)?.[1] || '');
    let match;

    while ((match = methodPattern.exec(source)) !== null) {
      const [, annotation, args] = match;
      endpoints.push({
        method: httpMethods[annotation],
        path: normalizePath(classPath, extractMappingPath(args || '')),
        source: path.relative(rootDir, filePath),
      });
    }
  }

  return endpoints.sort((left, right) => (
    left.path.localeCompare(right.path) || left.method.localeCompare(right.method)
  ));
};

const collectDocumentedEndpoints = () => {
  const markdown = fs.readFileSync(matrixFile, 'utf8');
  const endpointPattern = /^\|\s*(GET|POST|PUT|DELETE|PATCH)\s*\|\s*(`?)(\/api\/[^`|\s]+)\2\s*\|/gm;
  const endpoints = [];
  let match;

  while ((match = endpointPattern.exec(markdown)) !== null) {
    endpoints.push({ method: match[1], path: match[3] });
  }

  return endpoints.sort((left, right) => (
    left.path.localeCompare(right.path) || left.method.localeCompare(right.method)
  ));
};

const toKey = endpoint => `${endpoint.method} ${endpoint.path}`;

const actualEndpoints = collectControllerEndpoints();
const documentedEndpoints = collectDocumentedEndpoints();
const actualKeys = new Set(actualEndpoints.map(toKey));
const documentedKeys = new Set(documentedEndpoints.map(toKey));

const missing = actualEndpoints.filter(endpoint => !documentedKeys.has(toKey(endpoint)));
const stale = documentedEndpoints.filter(endpoint => !actualKeys.has(toKey(endpoint)));

if (missing.length > 0 || stale.length > 0) {
  if (missing.length > 0) {
    console.error('后端 API 权限矩阵缺少以下 Controller 端点:');
    for (const endpoint of missing) {
      console.error(`- ${toKey(endpoint)} (${endpoint.source})`);
    }
  }

  if (stale.length > 0) {
    console.error('后端 API 权限矩阵存在已失效端点:');
    for (const endpoint of stale) {
      console.error(`- ${toKey(endpoint)}`);
    }
  }

  process.exit(1);
}

console.log(`后端 API 权限矩阵校验通过，共 ${actualEndpoints.length} 个端点。`);
