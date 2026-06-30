import assert from 'node:assert/strict';
import http from 'node:http';
import { test } from 'node:test';

import { buildProductionFrontendAssetAudit } from './productionFrontendAssetAudit.mjs';
import { shouldAllowInsecureProductionAssetTls } from './productionFrontendAssetCli.mjs';
import { parseProductionFrontendAssetCliArgs } from './productionFrontendAssetCliArgs.mjs';
import {
  extractFrontendAssetPathsFromHtml,
  extractFrontendAssetPathsFromJavascript,
} from './productionFrontendAssetPaths.mjs';
import { extractFrontendAssetPathsFromCss } from './productionFrontendAssetCssPaths.mjs';
import { parseProductionAssetPathList } from './productionFrontendAssetExtras.mjs';

const withAssetServer = async (routes, run) => {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url || '/', 'http://localhost');
    const route = routes.get(url.pathname);

    if (route === undefined) {
      response.writeHead(404, { 'content-type': 'text/plain' });
      response.end('missing');
      return;
    }

    const isCustomRoute = typeof route === 'object' && route !== null;
    const body = isCustomRoute ? route.body : route;
    const contentType = isCustomRoute
      ? route.contentType
      : url.pathname.endsWith('.js') ? 'application/javascript' : 'text/html';
    response.writeHead(200, { 'content-type': contentType });
    response.end(request.method === 'HEAD' ? undefined : body);
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    return await run(baseUrl);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
};

test('从 HTML 入口提取并归一化 assets 路径', () => {
  const html = [
    '<script src="assets/main-a.js?v=1"></script>',
    '<link href="/assets/main-a.css#hash" rel="stylesheet">',
    '<script src="/other/app.js"></script>',
  ].join('');

  assert.deepEqual(extractFrontendAssetPathsFromHtml(html), [
    '/assets/main-a.js',
    '/assets/main-a.css',
  ]);
});

test('从 JS chunk 提取深层 assets 路径并忽略外部资源', () => {
  const javascript = [
    'const worker="/assets/deep-worker.js?build=1";',
    'import("./feature.js");',
    'new Worker(new URL("worker-sibling.js", import.meta.url));',
    'new Worker(new URL("https://cdn.example.com/assets/external-worker.js", import.meta.url));',
    'import("../outside.js");',
    'const external="https://cdn.example.com/assets/outside.js";',
  ].join('');

  assert.deepEqual(extractFrontendAssetPathsFromJavascript(javascript, '/assets/main-a.js'), [
    '/assets/deep-worker.js',
    '/assets/feature.js',
    '/assets/worker-sibling.js',
  ]);
});

test('JS 文档示例里的 assets 占位路径不会进入巡检', () => {
  const javascript = [
    'const markdown = "Use /assets/chunk.js and /assets/chunks/*.js and /assets/chunks/*.css";',
    "const markdownSnippet = '`import(\"./chunk.js\")` `@import \"./theme.css\"` `new URL(\"./worker.js\", import.meta.url)`';",
    'const theme = "/assets/theme.css";',
    'const worker = "/assets/worker.js";',
    'const real = "/assets/deep-worker.js";',
  ].join('');

  assert.deepEqual(extractFrontendAssetPathsFromJavascript(javascript, '/assets/main-a.js'), [
    '/assets/deep-worker.js',
  ]);
});

test('从 CSS url() 提取同站静态资源并忽略 data 和外链', () => {
  const css = [
    '@font-face { src: url("./font-main.woff2?v=1") format("woff2"); }',
    '.hero { background: url("/assets/hero-bg.png#hash"); }',
    '@import "./theme-a.css?v=1";',
    '@import url("./theme-url.css?v=1");',
    '@import url("../root-escape.css");',
    '.icon { background: url(data:image/svg+xml;base64,PHN2Zz4=); }',
    '.cdn { background: url("https://cdn.example.com/assets/outside.png"); }',
    '@import "https://cdn.example.com/assets/outside.css";',
    '/* url("./comment-only.png") @import "./comment-only.css"; */',
  ].join('');

  assert.deepEqual(extractFrontendAssetPathsFromCss(css, '/assets/main-a.css'), [
    '/assets/font-main.woff2',
    '/assets/hero-bg.png',
    '/assets/theme-url.css',
    '/assets/theme-a.css',
  ]);
});

test('从嵌套 JS chunk 提取同目录相对资源', () => {
  assert.deepEqual(
    extractFrontendAssetPathsFromJavascript('import("./feature.js");', '/assets/chunks/main-a.js'),
    ['/assets/chunks/feature.js']
  );
});

test('归一化部署前记录的旧 assets 列表', () => {
  assert.deepEqual(parseProductionAssetPathList([
    '/assets/main-old.js',
    'assets/chunk-old.js?v=1',
    'https://jsonutils.markz.fun/assets/legacy.css#hash',
    'https://cdn.example.com/static/outside.js',
    '/other/app.js',
    '/assets/main-old.js',
  ].join(',')), [
    '/assets/main-old.js',
    '/assets/chunk-old.js',
    '/assets/legacy.css',
  ]);
});

test('CLI 参数支持显式补充旧 hash 资源', () => {
  const originalExtraPaths = process.env.FRONTEND_ASSET_VERIFY_EXTRA_PATHS;
  process.env.FRONTEND_ASSET_VERIFY_EXTRA_PATHS = '/assets/from-env.js';
  try {
    const parsed = parseProductionFrontendAssetCliArgs([
      'https://jsonutils.markz.fun',
      '--extra-asset',
      'https://jsonutils.markz.fun/assets/SchemeViewerModal-old.js?t=1',
      '--extra-asset=/assets/inline-legacy.js',
      '--extra-assets=/assets/legacy.css,/not-assets/skip.js',
      '--print-paths',
    ]);

    assert.equal(parsed.baseUrl, 'https://jsonutils.markz.fun');
    assert.equal(parsed.shouldPrintPaths, true);
    assert.deepEqual(parsed.extraAssetPaths, [
      '/assets/from-env.js',
      '/assets/SchemeViewerModal-old.js',
      '/assets/inline-legacy.js',
      '/assets/legacy.css',
    ]);
  } finally {
    if (originalExtraPaths === undefined) {
      delete process.env.FRONTEND_ASSET_VERIFY_EXTRA_PATHS;
    } else {
      process.env.FRONTEND_ASSET_VERIFY_EXTRA_PATHS = originalExtraPaths;
    }
  }
});

test('CLI 空 inline 旧资源参数不会污染 baseUrl', () => {
  const parsed = parseProductionFrontendAssetCliArgs([
    '--extra-assets=',
    '--print-paths',
  ]);

  assert.equal(parsed.baseUrl, 'https://jsonutils.markz.fun');
  assert.equal(parsed.shouldPrintPaths, true);
  assert.deepEqual(parsed.extraAssetPaths, []);
});

test('CLI TLS 兼容开关支持部署 wrapper 和直接脚本别名', () => {
  assert.equal(shouldAllowInsecureProductionAssetTls({}), false);
  assert.equal(shouldAllowInsecureProductionAssetTls({
    FRONTEND_ASSET_VERIFY_INSECURE_TLS: 'true',
  }), true);
  assert.equal(shouldAllowInsecureProductionAssetTls({
    PUBLIC_FRONTEND_ASSET_VERIFY_INSECURE_TLS: 'true',
  }), true);
  assert.equal(shouldAllowInsecureProductionAssetTls({
    PUBLIC_VERIFY_INSECURE_TLS: 'true',
  }), true);
  assert.equal(shouldAllowInsecureProductionAssetTls({
    FRONTEND_ASSET_VERIFY_INSECURE_TLS: 'false',
    PUBLIC_VERIFY_INSECURE_TLS: 'false',
  }), false);
});

test('额外旧 JS asset 会参与递归扫描和可达性校验', async () => {
  await withAssetServer(new Map([
    ['/', '<script type="module" src="/assets/main-new.js"></script>'],
    ['/assets/main-new.js', 'console.log("new");'],
    ['/assets/main-old.js', 'import("./legacy-panel.js");'],
    ['/assets/legacy-panel.js', 'console.log("legacy");'],
  ]), async (baseUrl) => {
    const audit = await buildProductionFrontendAssetAudit(baseUrl, ['/'], ['/assets/main-old.js']);

    assert.deepEqual(audit.failures, []);
    assert.deepEqual(audit.scannedJavascript, [
      '/assets/main-old.js',
      '/assets/main-new.js',
      '/assets/legacy-panel.js',
    ]);
    assert.deepEqual(audit.assetPaths, [
      '/assets/legacy-panel.js',
      '/assets/main-new.js',
      '/assets/main-old.js',
    ]);
  });
});

test('额外旧 JS asset 缺失时记录用户反馈的旧 chunk 失败', async () => {
  await withAssetServer(new Map([
    ['/', '<script type="module" src="/assets/main-new.js"></script>'],
    ['/assets/main-new.js', 'console.log("new");'],
  ]), async (baseUrl) => {
    const audit = await buildProductionFrontendAssetAudit(
      baseUrl,
      ['/'],
      ['/assets/SchemeViewerModal-c9NWMJSm.js']
    );

    assert.equal(audit.scannedJavascript.includes('/assets/SchemeViewerModal-c9NWMJSm.js'), true);
    assert.equal(audit.failures.length, 1);
    assert.match(
      audit.failures[0],
      /\/assets\/SchemeViewerModal-c9NWMJSm\.js: .* 返回 404/
    );
  });
});

test('递归扫描 JS chunk 内继续引用的静态资源', async () => {
  await withAssetServer(new Map([
    ['/', '<script type="module" src="/assets/main-a.js"></script>'],
    ['/assets/main-a.js', 'import("./chunks/feature-b.js");'],
    ['/assets/chunks/feature-b.js', 'new Worker(new URL("./deep-worker-c.js", import.meta.url));'],
    ['/assets/chunks/deep-worker-c.js', 'self.postMessage("ok");'],
  ]), async (baseUrl) => {
    const audit = await buildProductionFrontendAssetAudit(baseUrl, ['/']);

    assert.deepEqual(audit.failures, []);
    assert.deepEqual(audit.scannedJavascript, [
      '/assets/main-a.js',
      '/assets/chunks/feature-b.js',
      '/assets/chunks/deep-worker-c.js',
    ]);
    assert.deepEqual(audit.assetPaths, [
      '/assets/chunks/deep-worker-c.js',
      '/assets/chunks/feature-b.js',
      '/assets/main-a.js',
    ]);
  });
});

test('递归扫描 CSS url() 引用的字体和图片资源', async () => {
  await withAssetServer(new Map([
    ['/', '<link rel="stylesheet" href="/assets/main-a.css">'],
    ['/assets/main-a.css', {
      body: '@font-face{src:url("./font-main.woff2")} .hero{background:url("/assets/hero-bg.png")}',
      contentType: 'text/css',
    }],
    ['/assets/font-main.woff2', 'font-data'],
    ['/assets/hero-bg.png', 'image-data'],
  ]), async (baseUrl) => {
    const audit = await buildProductionFrontendAssetAudit(baseUrl, ['/']);

    assert.deepEqual(audit.failures, []);
    assert.deepEqual(audit.scannedCss, ['/assets/main-a.css']);
    assert.deepEqual(audit.assetPaths, [
      '/assets/font-main.woff2',
      '/assets/hero-bg.png',
      '/assets/main-a.css',
    ]);
  });
});

test('递归扫描 CSS @import 引入的样式和后续资源', async () => {
  await withAssetServer(new Map([
    ['/', '<link rel="stylesheet" href="/assets/main-a.css">'],
    ['/assets/main-a.css', {
      body: '@import "./chunks/theme-a.css?v=1";',
      contentType: 'text/css',
    }],
    ['/assets/chunks/theme-a.css', {
      body: '.logo{background:url("./logo-a.svg")}',
      contentType: 'text/css',
    }],
    ['/assets/chunks/logo-a.svg', '<svg></svg>'],
  ]), async (baseUrl) => {
    const audit = await buildProductionFrontendAssetAudit(baseUrl, ['/']);

    assert.deepEqual(audit.failures, []);
    assert.deepEqual(audit.scannedCss, ['/assets/main-a.css', '/assets/chunks/theme-a.css']);
    assert.deepEqual(audit.assetPaths, [
      '/assets/chunks/logo-a.svg',
      '/assets/chunks/theme-a.css',
      '/assets/main-a.css',
    ]);
  });
});

test('入口页面缺失时记录页面失败并继续扫描其他入口', async () => {
  await withAssetServer(new Map([
    ['/', '<script type="module" src="/assets/main-a.js"></script>'],
    ['/assets/main-a.js', 'console.log("ok");'],
  ]), async (baseUrl) => {
    const audit = await buildProductionFrontendAssetAudit(baseUrl, ['/', '/admin.html']);

    assert.equal(audit.assetPaths.includes('/assets/main-a.js'), true);
    assert.equal(audit.scannedJavascript.includes('/assets/main-a.js'), true);
    assert.equal(audit.failures.length, 1);
    assert.match(audit.failures[0], /\/admin\.html: .*\/admin\.html 返回 404/);
  });
});

test('二级 JS chunk 缺失时记录资源失败', async () => {
  await withAssetServer(new Map([
    ['/', '<script type="module" src="/assets/main-a.js"></script>'],
    ['/assets/main-a.js', 'const chunk="/assets/missing-feature-b.js";'],
  ]), async (baseUrl) => {
    const audit = await buildProductionFrontendAssetAudit(baseUrl, ['/']);

    assert.equal(audit.scannedJavascript.includes('/assets/missing-feature-b.js'), true);
    assert.equal(audit.failures.length, 1);
    assert.match(audit.failures[0], /\/assets\/missing-feature-b\.js: .* 返回 404/);
  });
});

test('import.meta.url 裸文件名 worker 缺失时记录资源失败', async () => {
  await withAssetServer(new Map([
    ['/', '<script type="module" src="/assets/main-a.js"></script>'],
    ['/assets/main-a.js', 'new Worker(new URL("worker-missing.js", import.meta.url));'],
  ]), async (baseUrl) => {
    const audit = await buildProductionFrontendAssetAudit(baseUrl, ['/']);

    assert.equal(audit.assetPaths.includes('/assets/worker-missing.js'), true);
    assert.equal(audit.failures.length, 1);
    assert.match(audit.failures[0], /\/assets\/worker-missing\.js: .* 返回 404/);
  });
});

test('JS chunk 返回 HTML fallback 时记录 MIME 失败', async () => {
  await withAssetServer(new Map([
    ['/', '<script type="module" src="/assets/main-a.js"></script>'],
    ['/assets/main-a.js', {
      body: '<!doctype html><div id="root"></div>',
      contentType: 'text/html; charset=utf-8',
    }],
  ]), async (baseUrl) => {
    const audit = await buildProductionFrontendAssetAudit(baseUrl, ['/']);

    assert.equal(audit.failures.length, 1);
    assert.match(audit.failures[0], /\/assets\/main-a\.js: .*Content-Type text\/html; charset=utf-8 不是 JavaScript/);
  });
});
