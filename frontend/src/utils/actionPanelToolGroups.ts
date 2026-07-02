import { TransformMode } from '../types';
import type { ActionPanelToolGroup } from './actionPanelToolGroupTypes';

export const ACTION_PANEL_TOOL_GROUPS: ActionPanelToolGroup[] = [
  {
    id: 'preview-output',
    title: '预览 / 输出',
    items: [
      { mode: TransformMode.NONE, label: '原始视图', iconId: 'document', colorClass: 'text-gray-400' },
      { mode: TransformMode.FORMAT, label: '格式化', iconId: 'format', colorClass: 'text-blue-400' },
      { mode: TransformMode.DEEP_FORMAT, label: '嵌套解析', iconId: 'flask', colorClass: 'text-purple-400', dataTour: 'deep-format-btn' },
      { mode: TransformMode.MINIFY, label: '压缩 / 去空格', iconId: 'bolt', colorClass: 'text-cyan-400' },
    ],
  },
  {
    id: 'encoding-escape',
    title: '编码 / 转义',
    items: [
      { mode: TransformMode.ESCAPE, label: '转义', iconId: 'escape', colorClass: 'text-amber-400', dataTour: 'escape-btn' },
      { mode: TransformMode.UNESCAPE, label: '反转义', iconId: 'quote', colorClass: 'text-yellow-400' },
      { mode: TransformMode.UNICODE_TO_CN, label: 'Unicode 转中文', iconId: 'unicode', colorClass: 'text-fuchsia-400' },
      { mode: TransformMode.CN_TO_UNICODE, label: '中文 转 Unicode', iconId: 'chinese', colorClass: 'text-pink-400' },
      { mode: TransformMode.URL_ENCODE, label: 'URL 编码', iconId: 'percent', colorClass: 'text-rose-400' },
      { mode: TransformMode.URL_DECODE, label: 'URL 解码', iconId: 'url', colorClass: 'text-red-400' },
      { mode: TransformMode.BASE64_ENCODE, label: 'Base64 编码', iconId: 'base64', colorClass: 'text-indigo-400' },
      { mode: TransformMode.BASE64_DECODE, label: 'Base64 解码', iconId: 'base64-short', colorClass: 'text-sky-400' },
    ],
  },
  {
    id: 'organize-generate',
    title: '整理 / 生成',
    items: [
      { mode: TransformMode.SORT_KEYS, label: 'Key 排序', iconId: 'sort', colorClass: 'text-teal-400' },
      { mode: TransformMode.JSON_TO_TYPESCRIPT, label: 'JSON 转 TS', iconId: 'typescript', colorClass: 'text-sky-300', dataTour: 'json-to-ts-btn' },
    ],
  },
];
