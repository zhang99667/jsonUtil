import { readFileSync } from 'fs';
import path from 'path';
import { defineConfig, loadEnv, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
) as { version?: string };

const readRootChangelog = (): string => {
  try {
    return readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf-8');
  } catch {
    return '';
  }
};

const extractRecentChangelogMarkdown = (markdown: string, limit = 8): string => {
  const lines: string[] = [];
  let entryCount = 0;
  let hasStarted = false;

  for (const line of markdown.split(/\r?\n/)) {
    if (line.startsWith('## ')) {
      entryCount++;
      if (entryCount > limit) break;
      hasStarted = true;
    }

    if (hasStarted) {
      lines.push(line);
    }
  }

  return lines.join('\n').trim();
};

const changelogMarkdown = readRootChangelog();
const frontendChangelogMarkdown = extractRecentChangelogMarkdown(changelogMarkdown, 12);

type VitestCompatibleUserConfig = UserConfig & {
  test?: {
    exclude?: string[];
  };
};

const createVersionManifestPlugin = () => ({
  name: 'json-helper-version-manifest',
  generateBundle() {
    const version = packageJson.version || '0.0.0';
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: JSON.stringify({
        name: 'JSONUtils',
        version,
        versionLabel: `v${version}`,
        builtAt: new Date().toISOString(),
        changelogMarkdown: extractRecentChangelogMarkdown(changelogMarkdown),
      }, null, 2),
    });
  },
});

const getScopedPackageName = (id: string, scope: string) => {
  const normalized = id.split(path.sep).join('/');
  const match = normalized.match(new RegExp(`node_modules/${scope}/([^/]+)`));
  return match ? match[1] : null;
};

const getNodeModulePackageName = (id: string) => {
  const normalized = id.split(path.sep).join('/');
  const match = normalized.match(/node_modules\/((?:@[^/]+\/[^/]+)|[^/]+)/);
  return match ? match[1] : null;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const config: VitestCompatibleUserConfig = {
    base: '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
      open: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [react(), createVersionManifestPlugin()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version || '0.0.0'),
      'import.meta.env.VITE_APP_CHANGELOG': JSON.stringify(frontendChangelogMarkdown)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    css: {
      postcss: './postcss.config.js'
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          admin: path.resolve(__dirname, 'admin.html'),
        },
        output: {
          manualChunks(id) {
            const normalizedId = id.split(path.sep).join('/');
            if (
              normalizedId.includes('commonjsHelpers') ||
              normalizedId.includes('vite/preload-helper')
            ) {
              return 'vendor-runtime';
            }
            if (!id.includes('node_modules')) return undefined;

            const packageName = getNodeModulePackageName(id);

            if (packageName === 'monaco-editor') return 'vendor-monaco';
            if (packageName === '@google/genai') return 'vendor-ai';
            if (['react', 'react-dom', 'scheduler'].includes(packageName || '')) return 'vendor-react';
            if (packageName === '@ant-design/icons') return 'vendor-antd-icons';
            if (packageName === 'antd') return 'vendor-antd';
            if (packageName === '@ant-design/charts') return 'vendor-ant-design-charts';
            if ([
              'ajv',
              'ajv-formats',
              'fast-deep-equal',
              'fast-uri',
              'json-schema-traverse',
              'require-from-string',
            ].includes(packageName || '')) return 'vendor-json-schema';

            const antvPackage = getScopedPackageName(id, '@antv');
            if (antvPackage) return `vendor-antv-${antvPackage}`;

            if (!packageName) return 'vendor';

            if (
              packageName.startsWith('rc-') ||
              packageName.startsWith('@rc-component/') ||
              packageName.startsWith('@ant-design/')
            ) {
              return 'vendor-antd-deps';
            }
            if (packageName.startsWith('@babel/') || packageName === 'tslib') return 'vendor-runtime';
            if (packageName === 'axios') return 'vendor-http';
            if (packageName === 'html2canvas') return 'vendor-html2canvas';
            if (packageName === 'driver.js') return 'vendor-driver';
            if (packageName === 'qrcode.react') return 'vendor-qrcode';
            if (packageName.startsWith('d3-')) return 'vendor-d3';
            if (packageName.startsWith('ml-')) return 'vendor-ml';
            if (
              packageName.startsWith('@emotion/') ||
              ['goober', 'styled-components', 'stylis'].includes(packageName)
            ) {
              return 'vendor-style-runtime';
            }
            if (
              [
                'bubblesets-js',
                'dagre',
                'gl-matrix',
                'graphlib',
                'internmap',
                'pdfast',
              ].includes(packageName)
            ) {
              return 'vendor-graph-utils';
            }
            if (
              [
                'async-validator',
                'classnames',
                'compute-scroll-into-view',
                'copy-to-clipboard',
                'dayjs',
                'lodash',
                'lodash-es',
                'scroll-into-view-if-needed',
                'throttle-debounce',
              ].includes(packageName)
            ) {
              return 'vendor-utils';
            }
            if (
              [
                'diff',
                'json-source-map',
                'jsonpath-plus',
              ].includes(packageName)
            ) {
              return 'vendor-tools';
            }

            return 'vendor-misc';
          },
        },
      },
    },
    test: {
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/e2e/**',
        '**/e2e-performance/**',
      ],
    }
  };

  return config;
});
