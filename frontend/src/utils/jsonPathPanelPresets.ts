export const JSONPATH_EXAMPLES = [
  { label: '根节点', query: '$' },
  { label: '所有属性', query: '$.*' },
  { label: '数组第一项', query: '$[0]' },
  { label: '递归搜索', query: '$..name' },
  { label: '过滤条件', query: '$[?(@.age > 18)]' },
];

export const RESPONSE_JSONPATH_PRESETS = [
  { label: 'action_cmd', query: '$..action_cmd' },
  { label: 'button_cmd', query: '$..button_cmd' },
  { label: 'scheme', query: '$..scheme' },
  { label: 'url', query: '$..url' },
  { label: 'params', query: '$..params' },
  { label: 'traceId', query: '$..traceId' },
];
