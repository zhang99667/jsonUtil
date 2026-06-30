import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveJavascriptAssetCandidatePaths } from './productionFrontendAssetJavascriptPathResolvers.mjs';

test('JS 候选路径解析保持 assets、相对路径和 import.meta.url 的顺序', () => {
  assert.deepEqual(resolveJavascriptAssetCandidatePaths({
    assetStrings: ['/assets/deep-worker.js?build=1', '/assets/chunk.js'],
    relativeStrings: ['./feature.js', '../outside.js'],
    importMetaStrings: [
      'worker-sibling.js',
      'https://cdn.example.com/assets/external-worker.js',
      './feature.js',
    ],
  }, '/assets/main-a.js'), [
    '/assets/deep-worker.js',
    '/assets/feature.js',
    '/assets/worker-sibling.js',
  ]);
});

test('JS 候选路径解析会在归一化后过滤文档示例路径', () => {
  assert.deepEqual(resolveJavascriptAssetCandidatePaths({
    assetStrings: ['/assets/chunks/*.js', '/assets/theme.css', '/assets/real-worker.js'],
    relativeStrings: ['./chunk.js', './theme.css'],
    importMetaStrings: ['./worker.js'],
  }, '/assets/main-a.js'), [
    '/assets/real-worker.js',
  ]);
});

test('JS 候选路径解析支持嵌套 chunk 同目录资源', () => {
  assert.deepEqual(resolveJavascriptAssetCandidatePaths({
    assetStrings: [],
    relativeStrings: ['./feature.js'],
    importMetaStrings: ['./deep-worker.js'],
  }, '/assets/chunks/main-a.js'), [
    '/assets/chunks/feature.js',
    '/assets/chunks/deep-worker.js',
  ]);
});
