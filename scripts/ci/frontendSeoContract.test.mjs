import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { collectFrontendSeoFailures } from './frontendSeoContract.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('JSONUtils SEO 契约锁定独立工具身份与发现文件', () => {
  assert.deepEqual(collectFrontendSeoFailures(rootDir), []);
});

test('JSONUtils SEO 契约拦截旧标题和博客域名串入', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-seo-'));
  try {
    for (const file of [
      'frontend/index.html',
      'frontend/metadata.json',
      'frontend/nginx.conf',
      'frontend/public/robots.txt',
      'frontend/public/sitemap.xml',
    ]) {
      const target = path.join(fixture, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(rootDir, file), target);
    }
    fs.writeFileSync(
      path.join(fixture, 'frontend/index.html'),
      fs.readFileSync(path.join(fixture, 'frontend/index.html'), 'utf8')
        .replace('JSONUtils - 在线 JSON 格式化、校验与智能修复工具', 'JSONUtils - 专业版')
        .replace('https://jsonutils.markz.fun/', 'https://markz.fun/'),
    );

    const failures = collectFrontendSeoFailures(fixture);
    assert.equal(failures.some(failure => failure.includes('缺少 SEO 契约')), true);
    assert.equal(failures.some(failure => failure.includes('不能声明博客域名')), true);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});
