import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { getManualChunkName } from './config/chunkStrategy';
import {
  createVersionManifestPlugin,
  extractRecentChangelogMarkdown,
  readJsonFile,
  readTextFileSafely,
} from './config/versionManifest';

const packageJson = readJsonFile<{ version?: string }>(new URL('./package.json', import.meta.url));
const packageVersion = packageJson.version || '0.0.0';
const changelogMarkdown = readTextFileSafely(new URL('../CHANGELOG.md', import.meta.url));
const frontendChangelogMarkdown = extractRecentChangelogMarkdown(changelogMarkdown, 12);

const createMonacoStaticAssetsPlugin = () => ({
  name: 'jsonutils-monaco-static-assets',
  apply: 'build' as const,
  closeBundle() {
    const sourceDir = path.resolve(__dirname, 'node_modules/monaco-editor/min/vs');
    const targetDir = path.resolve(__dirname, 'dist/monaco/vs');
    fs.rmSync(targetDir, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(targetDir), { recursive: true });
    fs.cpSync(sourceDir, targetDir, { recursive: true });
  },
});

type VitestCompatibleUserConfig = UserConfig & {
  test?: {
    exclude?: string[];
  };
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
    plugins: [react(), createVersionManifestPlugin({
      version: packageVersion,
      changelogMarkdown,
    }), createMonacoStaticAssetsPlugin()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageVersion),
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
          manualChunks: getManualChunkName,
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
