import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { collectStaticRetentionConfigFailures } from './frontendStaticRetentionConfig.mjs';
import { collectNginxPublicRoutingFailures } from './frontendNginxPublicRouting.mjs';

const withTempRoot = (run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-static-config-'));
  try {
    return run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

const writeFixtureFile = (rootDir, file, content) => {
  const filePath = path.join(rootDir, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

test('静态资源保留配置检查会报告缺失片段', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'frontend/Dockerfile', 'COPY dist /opt/jsonutils-dist\n');

    const failures = collectStaticRetentionConfigFailures(rootDir, [
      {
        file: 'frontend/Dockerfile',
        snippets: [
          'COPY dist /opt/jsonutils-dist',
          'RUN chmod +x /docker-entrypoint.d/40-sync-static-assets.sh',
        ],
      },
    ]);

    assert.deepEqual(failures, [
      'frontend/Dockerfile: 缺少 "RUN chmod +x /docker-entrypoint.d/40-sync-static-assets.sh"',
    ]);
  });
});

test('静态资源保留配置检查会报告缺失文件', () => {
  withTempRoot((rootDir) => {
    const failures = collectStaticRetentionConfigFailures(rootDir, [
      {
        file: 'frontend/Dockerfile',
        snippets: ['COPY dist /opt/jsonutils-dist'],
      },
    ]);

    assert.deepEqual(failures, [
      'frontend/Dockerfile: 缺少配置文件',
    ]);
  });
});

test('静态资源保留配置检查通过时不产生失败项', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(
      rootDir,
      'docker-compose.yml',
      [
        'STATIC_ASSET_RETENTION_DAYS=${STATIC_ASSET_RETENTION_DAYS:-14}',
        'frontend-static:/usr/share/nginx/html',
      ].join('\n')
    );

    const failures = collectStaticRetentionConfigFailures(rootDir, [
      {
        file: 'docker-compose.yml',
        snippets: [
          'STATIC_ASSET_RETENTION_DAYS=${STATIC_ASSET_RETENTION_DAYS:-14}',
          'frontend-static:/usr/share/nginx/html',
        ],
      },
    ]);

    assert.deepEqual(failures, []);
  });
});

test('静态资源保留配置检查会保护公网巡检默认安全配置', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(
      rootDir,
      'scripts/deploy/ssh-docker-compose-deploy.sh',
      [
        'DEFAULT_PUBLIC_BASE_URL="${DEFAULT_PUBLIC_BASE_URL:-https://jsonutils.markz.fun}"',
        'PUBLIC_VERIFY_INSECURE_TLS="${PUBLIC_VERIFY_INSECURE_TLS:-false}"',
        'PUBLIC_FRONTEND_ASSET_VERIFY_INSECURE_TLS="${PUBLIC_FRONTEND_ASSET_VERIFY_INSECURE_TLS:-$PUBLIC_VERIFY_INSECURE_TLS}"',
        'local public_base_url="${PUBLIC_BASE_URL:-$DEFAULT_PUBLIC_BASE_URL}"',
      ].join('\n')
    );

    const failures = collectStaticRetentionConfigFailures(rootDir, [
      {
        file: 'scripts/deploy/ssh-docker-compose-deploy.sh',
        snippets: [
          'DEFAULT_PUBLIC_BASE_URL="${DEFAULT_PUBLIC_BASE_URL:-https://jsonutils.markz.fun}"',
          'PUBLIC_VERIFY_INSECURE_TLS="${PUBLIC_VERIFY_INSECURE_TLS:-false}"',
          'PUBLIC_FRONTEND_ASSET_VERIFY_INSECURE_TLS="${PUBLIC_FRONTEND_ASSET_VERIFY_INSECURE_TLS:-$PUBLIC_VERIFY_INSECURE_TLS}"',
          'local public_base_url="${PUBLIC_BASE_URL:-$DEFAULT_PUBLIC_BASE_URL}"',
        ],
      },
    ]);

    assert.deepEqual(failures, []);
  });
});

test('静态资源保留配置检查会保护本机 SSH 部署旧资源捕获失败处理', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(
      rootDir,
      'scripts/deploy/ssh-docker-compose-deploy.sh',
      [
        'local public_base_url="${PUBLIC_BASE_URL:-$DEFAULT_PUBLIC_BASE_URL}"',
        'local legacy_assets_file',
        'local legacy_capture_status=0',
        'node "$ROOT_DIR/scripts/ci/check-production-frontend-assets.mjs" "$public_base_url" --print-paths',
      ].join('\n')
    );

    const failures = collectStaticRetentionConfigFailures(rootDir, [
      {
        file: 'scripts/deploy/ssh-docker-compose-deploy.sh',
        snippets: [
          'local public_base_url="${PUBLIC_BASE_URL:-$DEFAULT_PUBLIC_BASE_URL}"',
          'local legacy_assets_file',
          'local legacy_capture_status=0',
          'node "$ROOT_DIR/scripts/ci/check-production-frontend-assets.mjs" "$public_base_url" --print-paths',
          'legacy_capture_status=$?',
          '部署前公网前端静态资源捕获失败，且未产出任何旧资源路径',
        ],
      },
    ]);

    assert.deepEqual(failures, [
      'scripts/deploy/ssh-docker-compose-deploy.sh: 缺少 "legacy_capture_status=$?"',
      'scripts/deploy/ssh-docker-compose-deploy.sh: 缺少 "部署前公网前端静态资源捕获失败，且未产出任何旧资源路径"',
    ]);
  });
});

test('静态资源保留配置检查会保护 GitHub workflow 发布复查链路', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(
      rootDir,
      '.github/workflows/deploy.yml',
      [
        'run: node scripts/ci/check-frontend-static-retention.mjs',
        'legacy_assets_file="$(mktemp)"',
        'legacy_capture_status=0',
        'node scripts/ci/check-production-frontend-assets.mjs "$base_url" --print-paths',
        'printf \'LEGACY_FRONTEND_ASSETS=%s\\n\' "$legacy_assets" >> "$GITHUB_ENV"',
      ].join('\n')
    );

    const failures = collectStaticRetentionConfigFailures(rootDir, [
      {
        file: '.github/workflows/deploy.yml',
        snippets: [
          'run: node scripts/ci/check-frontend-static-retention.mjs',
          'legacy_assets_file="$(mktemp)"',
          'legacy_capture_status=0',
          'node scripts/ci/check-production-frontend-assets.mjs "$base_url" --print-paths',
          'legacy_capture_status=$?',
          'Failed to capture legacy frontend assets and no asset paths were produced.',
          'printf \'LEGACY_FRONTEND_ASSETS=%s\\n\' "$legacy_assets" >> "$GITHUB_ENV"',
          'FRONTEND_ASSET_VERIFY_EXTRA_PATHS: ${{ env.LEGACY_FRONTEND_ASSETS }}',
        ],
      },
    ]);

    assert.deepEqual(failures, [
      '.github/workflows/deploy.yml: 缺少 "legacy_capture_status=$?"',
      '.github/workflows/deploy.yml: 缺少 "Failed to capture legacy frontend assets and no asset paths were produced."',
      '.github/workflows/deploy.yml: 缺少 "FRONTEND_ASSET_VERIFY_EXTRA_PATHS: ${{ env.LEGACY_FRONTEND_ASSETS }}"',
    ]);
  });
});

const nginxConfig = (publicHttpHosts, publicHttpsHosts, adminHosts = 'admin.markz.fun') => `
server {
    listen 80;
    server_name ${publicHttpHosts};
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${adminHosts};
    location = / { return 301 /admin.html; }
    location / { try_files $uri $uri/ /admin.html; }
}

server {
    listen 443 ssl http2;
    server_name ${publicHttpsHosts};
    location / { try_files $uri $uri/ /index.html; }
}
`;

test('Nginx 公开域名路由检查会保护 JSONUtils 主站别名', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(
      rootDir,
      'frontend/nginx.conf',
      nginxConfig(
        'jsonutils.markz.fun markz.fun www.markz.fun',
        'jsonutils.markz.fun markz.fun www.markz.fun'
      )
    );

    assert.deepEqual(collectNginxPublicRoutingFailures(rootDir), []);
  });
});

test('Nginx 公开域名路由检查会拦截公开域名落入后台', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(
      rootDir,
      'frontend/nginx.conf',
      nginxConfig(
        'jsonutils.markz.fun markz.fun',
        'jsonutils.markz.fun markz.fun',
        'admin.markz.fun www.markz.fun'
      )
    );

    assert.deepEqual(collectNginxPublicRoutingFailures(rootDir), [
      'frontend/nginx.conf: 公开域名 www.markz.fun 未绑定到主站 HTTP 跳转 server_name',
      'frontend/nginx.conf: 公开域名 www.markz.fun 未绑定到主站 HTTPS server_name',
      'frontend/nginx.conf: 公开域名 www.markz.fun 不能绑定到后台 server_name',
    ]);
  });
});

test('Nginx 公开域名路由检查会拦截外部业务域名被 JSONUtils 接管', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(
      rootDir,
      'frontend/nginx.conf',
      nginxConfig(
        'jsonutils.markz.fun markz.fun www.markz.fun zhangjihao.markz.fun',
        'jsonutils.markz.fun markz.fun www.markz.fun'
      )
    );

    assert.deepEqual(collectNginxPublicRoutingFailures(rootDir), [
      'frontend/nginx.conf: 外部域名 zhangjihao.markz.fun 不能绑定到 JSONUtils server_name',
    ]);
  });
});
