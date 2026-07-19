import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { test } from 'node:test';

const rootDir = path.resolve(import.meta.dirname, '../..');
const verifierPath = path.join(rootDir, 'scripts/deploy/verify-public-deploy.sh');

const withFixtureServer = async (run) => {
  const requests = [];
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    requests.push(url.pathname);
    if (url.pathname === '/version.json') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end('{"version":"9.9.9"}');
      return;
    }
    if (url.pathname === '/api/health') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end('{"data":"pong"}');
      return;
    }
    if (url.pathname === '/ok') {
      response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('外部业务页面');
      return;
    }
    if (url.pathname === '/redirect') {
      response.writeHead(302, { Location: '/ok' });
      response.end();
      return;
    }
    if (url.pathname === '/missing-expected') {
      response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('其它内容');
      return;
    }
    if (url.pathname === '/forbidden') {
      response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('外部业务页面 JSONUtils 后台');
      return;
    }
    response.writeHead(503);
    response.end('外部服务不可用');
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    await run({ baseUrl, requests });
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
};

const runVerifier = (baseUrl, externalChecks) => new Promise((resolve, reject) => {
  const env = {
    ...process.env,
    PUBLIC_BASE_URL: baseUrl,
    PUBLIC_VERSION_PATH: '/version.json',
    PUBLIC_HEALTH_PATH: '/api/health',
    EXPECTED_APP_VERSION: '9.9.9',
    PUBLIC_VERIFY_RETRIES: '1',
    PUBLIC_VERIFY_INTERVAL: '0',
    PUBLIC_VERIFY_TIMEOUT: '2',
    PUBLIC_FRONTEND_ASSET_VERIFY_ENABLED: 'false',
  };
  delete env.PUBLIC_EXTERNAL_ROUTE_CHECKS;
  if (externalChecks !== undefined) env.PUBLIC_EXTERNAL_ROUTE_CHECKS = externalChecks;

  const child = spawn('bash', [verifierPath], { cwd: rootDir, env });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8').on('data', chunk => { stdout += chunk; });
  child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk; });
  child.once('error', reject);
  child.once('close', status => resolve({ status, stdout, stderr }));
});

test('默认验证只依赖 JSONUtils 主站版本与健康检查', async () => {
  await withFixtureServer(async ({ baseUrl, requests }) => {
    const result = await runVerifier(baseUrl);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /公网验证通过/u);
    assert.deepEqual(requests, ['/version.json', '/api/health']);
  });
});

test('显式外部检查保留成功、状态、重定向和文本边界', async () => {
  await withFixtureServer(async ({ baseUrl, requests }) => {
    let result = await runVerifier(baseUrl, `${baseUrl}/ok|外部业务页面|JSONUtils 后台`);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(requests.includes('/ok'));

    const failures = [
      [`${baseUrl}/unavailable|外部业务页面|`, /HTTP 状态异常/u],
      [`${baseUrl}/redirect|外部业务页面|`, /不应跳转到/u],
      [`${baseUrl}/missing-expected|外部业务页面|`, /缺少期望文本/u],
      [`${baseUrl}/forbidden|外部业务页面|JSONUtils 后台`, /命中禁止文本/u],
    ];
    for (const [checks, message] of failures) {
      result = await runVerifier(baseUrl, checks);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, message);
    }
  });
});
