import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { collectFrontendSeoFailures } from './frontendSeoContract.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const frontendDir = path.join(rootDir, 'frontend');

const assertFrontendNodeEntry = (scriptName, command) => {
  const [runtime, entry, ...extraArguments] = command.trim().split(/\s+/);
  assert.equal(runtime, 'node', `${scriptName} 必须使用 Node 单入口`);
  assert.equal(typeof entry, 'string', `${scriptName} 必须声明入口文件`);
  assert.deepEqual(extraArguments, [], `${scriptName} 不应携带额外参数`);

  const entryPath = path.resolve(frontendDir, entry);
  const relativeEntry = path.relative(frontendDir, entryPath);
  assert.deepEqual({
    withinFrontend: relativeEntry !== ''
      && !relativeEntry.startsWith(`..${path.sep}`)
      && !path.isAbsolute(relativeEntry),
    exists: fs.existsSync(entryPath),
  }, {
    withinFrontend: true,
    exists: true,
  }, `${scriptName} 入口必须位于前端构建上下文且真实存在`);
};

test('前端 Docker 构建闭包持续执行 SEO 与预加载检查', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(frontendDir, 'package.json'), 'utf8'));
  const dockerfile = fs.readFileSync(path.join(frontendDir, 'Dockerfile'), 'utf8');

  assert.equal(dockerfile.includes('RUN npm run build'), true);
  assert.equal(dockerfile.includes('RUN npm run check:preloads'), true);
  assert.equal(packageJson.scripts.build.includes('npm run check:seo'), true);
  assertFrontendNodeEntry('check:seo', packageJson.scripts['check:seo']);
  assertFrontendNodeEntry('check:preloads', packageJson.scripts['check:preloads']);
});

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
