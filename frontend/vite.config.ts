import path from 'path';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

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
  return {
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
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
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
            if (id.includes('commonjsHelpers')) return 'vendor-runtime';
            if (!id.includes('node_modules')) return undefined;

            const packageName = getNodeModulePackageName(id);

            if (packageName === 'monaco-editor') return 'vendor-monaco';
            if (packageName === '@google/genai') return 'vendor-ai';
            if (['react', 'react-dom', 'scheduler'].includes(packageName || '')) return 'vendor-react';
            if (packageName === '@ant-design/icons') return 'vendor-antd-icons';
            if (packageName === 'antd') return 'vendor-antd';
            if (packageName === '@ant-design/charts') return 'vendor-ant-design-charts';

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
                'qrcode.react',
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
      ],
    }
  };
});
