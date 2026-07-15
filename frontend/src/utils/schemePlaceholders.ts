import type { SchemePlaceholder, SchemePlaceholderGroup } from './schemeTypes';
import { appendJsonPathIndex, appendJsonPathKey } from './jsonPathSegments';

type PlaceholderValue =
  | string
  | number
  | boolean
  | null
  | PlaceholderValue[]
  | { [key: string]: PlaceholderValue };

const RUNTIME_PLACEHOLDER_RE = /^__[A-Z][A-Z0-9_]*__$/;
const RUNTIME_PLACEHOLDER_DESCRIPTIONS: Record<string, string> = {
  __CONVERT_CMD__: '运行时转换 CMD 占位符，当前文本未包含实际 CMD 内容',
  __WEBPANEL_CMD__: '运行时 WebPanel CMD 占位符，当前文本未包含实际 CMD 内容',
  __AD_EXTRA_PARAM_ENCODE_1__: '广告 extraParam 编码占位符，通常由渲染或投放链路在运行时替换',
  __EXT_RENDER_AFD__: 'AFD 渲染扩展信息占位符，当前 response 未携带实际扩展内容',
  __COINTIPS__: '金币奖励文案占位符，运行时会替换为实际奖励提示',
  __REWARD_NUM__: '奖励数量占位符，运行时会替换为实际金币或激励数值',
  __CONTINUEPLAY__: '继续完成任务动作占位符，运行时会绑定继续播放或继续任务行为',
  __LEAVE__: '离开动作占位符，运行时会绑定退出或关闭行为',
  __CLICK_ID__: '点击 ID 占位符，监测链路会在点击发生时替换',
  __SIGN__: '签名占位符，监测链路会在请求发送前替换',
  __CALLBACK_URL__: '回调 URL 占位符，监测链路会在运行时替换',
};

export const isRuntimePlaceholder = (value: string): boolean => (
  RUNTIME_PLACEHOLDER_RE.test(value.trim())
);

export const getRuntimePlaceholderDescription = (value: string): string => (
  RUNTIME_PLACEHOLDER_DESCRIPTIONS[value.trim()] ||
  '运行时占位符，当前文本未包含可继续展开的实际内容'
);

export const collectRuntimePlaceholders = (
  value: PlaceholderValue,
  path: string = '$'
): SchemePlaceholder[] => {
  if (typeof value === 'string') {
    return isRuntimePlaceholder(value)
      ? [{ path, value, description: getRuntimePlaceholderDescription(value) }]
      : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => (
      collectRuntimePlaceholders(item, appendJsonPathIndex(path, index))
    ));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => (
      collectRuntimePlaceholders(item, appendJsonPathKey(path, key))
    ));
  }

  return [];
};

export const buildSchemePlaceholderGroups = (
  placeholders: SchemePlaceholder[]
): SchemePlaceholderGroup[] => {
  const groups = new Map<string, SchemePlaceholderGroup>();

  placeholders.forEach(placeholder => {
    const group = groups.get(placeholder.value);
    if (group) {
      group.count += 1;
      group.paths.push(placeholder.path);
      return;
    }

    groups.set(placeholder.value, {
      value: placeholder.value,
      description: placeholder.description,
      count: 1,
      paths: [placeholder.path],
    });
  });

  return Array.from(groups.values()).sort((left, right) => (
    right.count - left.count || left.value.localeCompare(right.value)
  ));
};
