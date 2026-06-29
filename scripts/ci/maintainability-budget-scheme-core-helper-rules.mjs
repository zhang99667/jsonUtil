export const schemeCoreHelperMaintainabilityBudgets = [
  { file: 'frontend/src/utils/schemeUrlInfo.ts', maxLines: 70, reason: 'Scheme URL 信息提取应保持纯函数，避免 URL 参数和 hash 参数拼装回流核心解码文件' },
  { file: 'frontend/src/utils/schemeExposure.ts', maxLines: 130, reason: 'Scheme 暴露入口应聚焦协议分流与递归解码，嵌套 CMD 参数启发式应沉淀到 helper' },
  { file: 'frontend/src/utils/schemeNestedCommandExposure.ts', maxLines: 80, reason: 'Scheme 嵌套 CMD 参数扫描应聚焦 HTTP(S) query/hash 来源，参数值递归判断应沉淀到独立 helper' },
  { file: 'frontend/src/utils/schemeStructuredActionableParamValue.ts', maxLines: 110, reason: 'Scheme 结构化参数值可展开判断应独立承接 JSON 字符串、转义、URL 编码和 Base64 递归判断' },
  { file: 'frontend/src/utils/schemeLayerEncoding.ts', maxLines: 90, reason: 'Scheme 反向编码回写应独立于递归解码主流程，避免 URL/query/log-field 回写细节回流核心文件' },
  { file: 'frontend/src/utils/schemeQueryDetection.ts', maxLines: 80, reason: 'Scheme query-string 与前缀 query 识别应保持纯检测 helper，避免规则回流核心解码文件' },
  { file: 'frontend/src/utils/schemeQueryLayerEncoding.ts', maxLines: 120, reason: 'Scheme query-string layer 回写应独立承接 raw URL、日志字段和前缀 query 策略' },
  { file: 'frontend/src/utils/schemeUrlLayerEncoding.ts', maxLines: 80, reason: 'Scheme URL layer 回写应独立承接 query/hash 合并，避免反向编码主入口继续贴边' },
  { file: 'frontend/src/utils/schemeHashEncoding.ts', maxLines: 60, reason: 'Scheme hash route 与锚点参数回写应保持独立纯函数，避免反向编码 helper 继续贴边' },
];
