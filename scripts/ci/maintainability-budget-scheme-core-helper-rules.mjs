export const schemeCoreHelperMaintainabilityBudgets = [
  { file: 'frontend/src/utils/schemeUrlInfo.ts', maxLines: 70, reason: 'Scheme URL 信息提取应保持纯函数，避免 URL 参数和 hash 参数拼装回流核心解码文件' },
  { file: 'frontend/src/utils/schemeExposure.ts', maxLines: 130, reason: 'Scheme 暴露入口应聚焦协议分流与递归解码，嵌套 CMD 参数启发式应沉淀到 helper' },
  { file: 'frontend/src/utils/schemeNestedCommandExposure.ts', maxLines: 80, reason: 'Scheme 嵌套 CMD 参数扫描应聚焦 HTTP(S) query/hash 来源，参数值递归判断应沉淀到独立 helper' },
  { file: 'frontend/src/utils/schemeStructuredActionableParamValue.ts', maxLines: 110, reason: 'Scheme 结构化参数值可展开判断应独立承接 JSON 字符串、转义、URL 编码和 Base64 递归判断' },
  { file: 'frontend/src/utils/schemeLayerEncoding.ts', maxLines: 90, reason: 'Scheme 反向编码回写应独立于递归解码主流程，避免 URL/query/log-field 回写细节回流核心文件' },
  { file: 'frontend/src/utils/schemeQueryDetection.ts', maxLines: 80, reason: 'Scheme query-string 与前缀 query 识别应保持纯检测 helper，避免规则回流核心解码文件' },
  { file: 'frontend/src/utils/schemeQueryLayerEncoding.ts', maxLines: 75, reason: 'Scheme query-string layer 回写入口应只编排 JSON 解析、单参数策略、前缀 query 和兜底 query 序列化' },
  { file: 'frontend/src/utils/schemeQueryLayerSingleParamEncoding.ts', maxLines: 90, reason: 'Scheme query-string 单参数回写应独立承接 raw URL 和日志字段编码策略' },
  { file: 'frontend/src/utils/schemeUrlLayerEncoding.ts', maxLines: 80, reason: 'Scheme URL layer 回写应独立承接 query/hash 合并，避免反向编码主入口继续贴边' },
  { file: 'frontend/src/utils/schemeDisplayHeader.ts', maxLines: 80, reason: '根 Scheme 协议头展示与反向剥离应保持纯函数，避免预览元数据污染业务参数' },
  { file: 'frontend/src/utils/schemeDisplayHeader.test.ts', maxLines: 100, reason: '根 Scheme 协议头测试只锁展示、字段冲突、编辑回写和非法值回退' },
  { file: 'frontend/src/utils/schemeHashEncoding.ts', maxLines: 60, reason: 'Scheme hash route 与锚点参数回写应保持独立纯函数，避免反向编码 helper 继续贴边' },
];
