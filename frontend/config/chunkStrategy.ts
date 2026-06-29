const normalizeModuleId = (id: string): string => id.replace(/\\/g, '/');

export const getNodeModulePackageName = (id: string): string | null => {
  const normalized = normalizeModuleId(id);
  const marker = '/node_modules/';
  const markerIndex = normalized.lastIndexOf(marker);
  if (markerIndex < 0) return null;

  const packagePath = normalized.slice(markerIndex + marker.length);
  const [firstSegment, secondSegment] = packagePath.split('/');
  if (!firstSegment) return null;

  if (firstSegment.startsWith('@')) {
    return secondSegment ? `${firstSegment}/${secondSegment}` : null;
  }

  return firstSegment;
};

export const getScopedPackageName = (id: string, scope: string): string | null => {
  const packageName = getNodeModulePackageName(id);
  const scopePrefix = `${scope}/`;
  if (!packageName?.startsWith(scopePrefix)) return null;

  const scopedName = packageName.slice(scopePrefix.length);
  return scopedName || null;
};

const ANT_DESIGN_CHART_PACKAGES = new Set([
  '@ant-design/charts',
  '@ant-design/charts-util',
  '@ant-design/graphs',
  '@ant-design/plots',
]);

const JSON_SCHEMA_PACKAGES = new Set([
  'ajv',
  'ajv-formats',
  'fast-deep-equal',
  'fast-uri',
  'json-schema-traverse',
  'require-from-string',
]);

const STYLE_RUNTIME_PACKAGES = new Set([
  'goober',
  'styled-components',
  'stylis',
]);

const GRAPH_UTIL_PACKAGES = new Set([
  'bubblesets-js',
  'dagre',
  'gl-matrix',
  'graphlib',
  'internmap',
  'pdfast',
]);

const UTILITY_PACKAGES = new Set([
  'async-validator',
  'classnames',
  'compute-scroll-into-view',
  'copy-to-clipboard',
  'dayjs',
  'lodash',
  'lodash-es',
  'scroll-into-view-if-needed',
  'throttle-debounce',
]);

const TOOL_PACKAGES = new Set([
  'diff',
  'json-source-map',
  'jsonpath-plus',
]);

export const getManualChunkName = (id: string): string | undefined => {
  const normalizedId = normalizeModuleId(id);
  if (
    normalizedId.includes('commonjsHelpers') ||
    normalizedId.includes('vite/preload-helper')
  ) {
    return 'vendor-runtime';
  }

  if (!normalizedId.includes('/node_modules/')) return undefined;

  const packageName = getNodeModulePackageName(normalizedId);

  if (packageName === 'monaco-editor') return 'vendor-monaco';
  if (packageName === '@google/genai') return 'vendor-ai';
  if (['react', 'react-dom', 'scheduler'].includes(packageName || '')) return 'vendor-react';
  if (packageName === '@ant-design/icons') return 'vendor-antd-icons';
  if (ANT_DESIGN_CHART_PACKAGES.has(packageName || '')) return 'vendor-ant-design-charts';
  if (packageName === 'antd') return 'vendor-antd';
  if (JSON_SCHEMA_PACKAGES.has(packageName || '')) return 'vendor-json-schema';

  const antvPackage = getScopedPackageName(normalizedId, '@antv');
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
  if (packageName.startsWith('@emotion/') || STYLE_RUNTIME_PACKAGES.has(packageName)) {
    return 'vendor-style-runtime';
  }
  if (GRAPH_UTIL_PACKAGES.has(packageName)) return 'vendor-graph-utils';
  if (UTILITY_PACKAGES.has(packageName)) return 'vendor-utils';
  if (TOOL_PACKAGES.has(packageName)) return 'vendor-tools';

  return 'vendor-misc';
};
