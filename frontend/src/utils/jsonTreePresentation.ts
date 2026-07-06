import type { JsonTreeNodeKind } from './jsonTreeModel';
import type { JsonStringSemanticHint } from './jsonValueSemantics';

export const JSON_TREE_KIND_LABELS: Record<JsonTreeNodeKind, string> = {
  object: '对象',
  array: '数组',
  string: '字符串',
  number: '数字',
  boolean: '布尔',
  null: '空值',
};

export const getJsonTreeKindClassName = (kind: JsonTreeNodeKind): string => {
  if (kind === 'object') return 'border-blue-500/30 bg-blue-500/10 text-blue-200';
  if (kind === 'array') return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200';
  if (kind === 'string') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  if (kind === 'number') return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  if (kind === 'boolean') return 'border-violet-500/30 bg-violet-500/10 text-violet-200';
  return 'border-gray-500/30 bg-gray-500/10 text-gray-300';
};

export const getJsonPointerDisplayValue = (jsonPointer: string): string => (
  jsonPointer || '(root)'
);

export const getJsonTreeSemanticHintClassName = (kind: JsonStringSemanticHint['kind']): string => {
  if (kind === 'url') return 'border-sky-500/30 bg-sky-500/10 text-sky-100';
  if (kind === 'scheme') return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';
  if (kind === 'jwt') return 'border-indigo-500/30 bg-indigo-500/10 text-indigo-100';
  if (kind === 'base64') return 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-100';
  if (kind === 'email') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
  if (kind === 'phone') return 'border-lime-500/30 bg-lime-500/10 text-lime-100';
  if (kind === 'uuid') return 'border-slate-400/30 bg-slate-400/10 text-slate-100';
  if (kind === 'timestamp') return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-100';
  if (kind === 'hash') return 'border-stone-400/30 bg-stone-400/10 text-stone-100';
  if (kind === 'date' || kind === 'date-time') return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
  if (kind === 'resource-image') return 'border-pink-500/30 bg-pink-500/10 text-pink-100';
  if (kind === 'resource-video') return 'border-red-500/30 bg-red-500/10 text-red-100';
  if (kind === 'resource-lottie') return 'border-purple-500/30 bg-purple-500/10 text-purple-100';
  if (kind === 'resource-audio') return 'border-teal-500/30 bg-teal-500/10 text-teal-100';
  if (kind === 'resource-package') return 'border-orange-500/30 bg-orange-500/10 text-orange-100';
  return 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-100';
};

export const isJsonTreeArrayIndexKeyLabel = (value: string): boolean => (
  /^\[\d+\]$/.test(value)
);
