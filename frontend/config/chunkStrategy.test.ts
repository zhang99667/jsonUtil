import { describe, expect, it } from 'vitest';
import {
  getManualChunkName,
  getNodeModulePackageName,
  getScopedPackageName,
} from './chunkStrategy';

describe('chunkStrategy', () => {
  it('从不同平台路径中提取 node_modules 包名', () => {
    expect(getNodeModulePackageName('/repo/node_modules/react/index.js')).toBe('react');
    expect(getNodeModulePackageName('C:\\repo\\node_modules\\@antv\\g2\\esm\\index.js')).toBe('@antv/g2');
    expect(getScopedPackageName('/repo/node_modules/@antv/g6/index.js', '@antv')).toBe('g6');
    expect(getNodeModulePackageName('/repo/src/App.tsx')).toBeNull();
  });

  it('保持首屏关键依赖的稳定分包名称', () => {
    expect(getManualChunkName('/repo/node_modules/monaco-editor/esm/vs/editor/editor.api.js')).toBe('vendor-monaco');
    expect(getManualChunkName('/repo/node_modules/@google/genai/dist/index.js')).toBe('vendor-ai');
    expect(getManualChunkName('/repo/node_modules/react-dom/client.js')).toBe('vendor-react');
    expect(getManualChunkName('/repo/node_modules/antd/es/button/index.js')).toBe('vendor-antd');
  });

  it('隔离后台图表和低频工具依赖，避免回流到基础 chunk', () => {
    expect(getManualChunkName('/repo/node_modules/@ant-design/charts/es/index.js')).toBe('vendor-ant-design-charts');
    expect(getManualChunkName('/repo/node_modules/@antv/g2/esm/index.js')).toBe('vendor-antv-g2');
    expect(getManualChunkName('/repo/node_modules/qrcode.react/lib/index.js')).toBe('vendor-qrcode');
    expect(getManualChunkName('/repo/node_modules/jsonpath-plus/dist/index.js')).toBe('vendor-tools');
  });

  it('识别运行时、样式、工具和兜底 chunk', () => {
    expect(getManualChunkName('/repo/node_modules/vite/preload-helper.js')).toBe('vendor-runtime');
    expect(getManualChunkName('/repo/node_modules/@emotion/react/dist/index.js')).toBe('vendor-style-runtime');
    expect(getManualChunkName('/repo/node_modules/dayjs/dayjs.min.js')).toBe('vendor-utils');
    expect(getManualChunkName('/repo/node_modules/fast-deep-equal/index.js')).toBe('vendor-misc');
    expect(getManualChunkName('/repo/node_modules/unknown-lib/index.js')).toBe('vendor-misc');
    expect(getManualChunkName('/repo/src/main.tsx')).toBeUndefined();
  });
});
