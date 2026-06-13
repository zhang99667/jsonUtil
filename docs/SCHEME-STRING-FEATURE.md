# 转换路径记录机制 & Scheme 字符串解析方案

## 当前实现状态

本文最早用于描述“转换路径记录 + Scheme 字符串解析”的设计方案。当前代码已在此基础上演进为复杂 response / CMD / Scheme 解析工作台，核心能力包括：

- `deepParseWithContext()` 和 `inverseWithContext()` 已用于深度格式化和预览回写，负责记录转换路径并尽量保持原格式还原。
- `schemeUtils.ts` 支持 URL/Scheme/CMD/Base64/JWT 等字符串递归解码，默认深度已覆盖真实广告 response 中的多层跳转链路。
- `SchemeViewerModal.tsx` 支持整段 JSON response 粘贴、Worker 解码、Top CMD Schema 摘要、运行时占位符聚合、Base64 后缀元信息和 cmdHandler 风格复制。
- `TransformReportPanel.tsx` 支持深度解析报告、质量快照、诊断摘要、问题样本、占位符回填模板、cmdHandler 页面内对比和聚焦复制。
- `frontend/fixtures/scheme-corpus/` 已保存脱敏真实 response、质量 snapshot baseline 和 cmdHandler expected 子集。
- `npm run corpus:scheme` 已接入 GitHub Actions 的 `Scheme corpus baseline` 独立门禁，用于防止主 CMD Schema、Top 热点 Schema、占位符、扫描位置和关键参数路径退化。

后续新增 Scheme/CMD 能力时，优先补充脱敏 corpus 和 expected baseline，再修改解析规则。

## 核心问题

当前工具在 PREVIEW 区域编辑后，SOURCE 区域偶发无法按原格式还原。

**根本原因**：缺乏精确的转换路径记录。

### 现有问题分析

```typescript
// 当前的 deepParseJson - 只做单向转换，不记录转换路径
const deepParse = (obj: any): any => {
  if (typeof obj === 'string') {
    try {
      const innerParsed = JSON.parse(obj);  // ❌ 不知道是哪个路径被解析了
      if (typeof innerParsed === 'object') {
        return deepParse(innerParsed);       // ❌ 不知道嵌套了几层
      }
    } catch (e) { return obj; }
  }
  // ...
};

// 当前的 smartInverse - 试图通过比较推断，不可靠
const smartInverse = (output: string, originalInput: string): string => {
  // ❌ 只能通过类型差异推断，无法知道原始编码细节
  // ❌ 无法处理多层嵌套、Unicode、URL编码等组合
};
```

### 失败场景示例

```json
// 原始输入
{ "data": "{\"name\":\"\\u5f20\\u4e09\"}" }

// 深度格式化后 (PREVIEW)
{
  "data": {
    "name": "张三"
  }
}

// 用户修改后期望还原为
{ "data": "{\"name\":\"\\u674e\\u56db\"}" }

// 但实际可能还原为 (丢失 Unicode 编码)
{ "data": "{\"name\":\"李四\"}" }
```

**原因**：不知道原始 `data` 字段经历了 `JSON.parse` + `Unicode 解码` 两步转换。

---

## 解决方案：转换路径记录机制

### 核心思路

```
正向转换：记录每个路径上发生的转换序列
         ┌─────────────────────────────────────┐
         │  TransformContext (转换上下文)        │
         │  - pathRecords: Map<JSONPath, Steps> │
         └─────────────────────────────────────┘
                          │
    输入 JSON ──► 逐路径转换 ──► 输出 JSON
                          │
                    记录每步操作
                          │
         ┌─────────────────────────────────────┐
         │  PathRecord 示例:                     │
         │  "$.data" → [                        │
         │    { type: 'json_parse' },           │
         │    { type: 'unicode_decode' }        │
         │  ]                                   │
         └─────────────────────────────────────┘

反向转换：按路径记录逆序还原
         ┌─────────────────────────────────────┐
         │  编辑后 JSON ──► 查找路径记录          │
         │       │                              │
         │       ▼                              │
         │  逆序执行: unicode_encode → stringify │
         │       │                              │
         │       ▼                              │
         │  还原后 JSON (与原始格式一致)          │
         └─────────────────────────────────────┘
```

### 数据结构设计

```typescript
// 单步转换操作
interface TransformStep {
  type: 'json_parse' | 'json_stringify' | 'unicode_decode' | 'unicode_encode' 
      | 'url_decode' | 'url_encode' | 'base64_decode' | 'base64_encode'
      | 'unescape' | 'escape';
  // 可选：保存原始细节用于精确还原
  originalEncoding?: string;  // 如 'utf-8', 'gbk'
  originalPadding?: boolean;  // Base64 是否有 padding
}

// 单个路径的转换记录
interface PathTransformRecord {
  path: string;              // JSON Path, 如 "$.data" 或 "$.users[0].config"
  steps: TransformStep[];    // 该路径上发生的转换序列（正向顺序）
  originalValue: string;     // 原始字符串值（用于校验）
}

// 整个转换的上下文
interface TransformContext {
  mode: TransformMode;
  records: Map<string, PathTransformRecord>;  // path -> record
  timestamp: number;
}

// 转换结果（带上下文）
interface TransformResult {
  output: string;            // 转换后的 JSON 字符串
  context: TransformContext; // 转换上下文（用于反向还原）
}
```

### 核心函数重构

#### 1. 带路径记录的深度解析

```typescript
function deepParseWithContext(
  input: string,
  options?: { maxDepth?: number }
): TransformResult {
  const context: TransformContext = {
    mode: TransformMode.DEEP_FORMAT,
    records: new Map(),
    timestamp: Date.now(),
  };

  const parsed = JSON.parse(input);
  
  const processValue = (value: any, currentPath: string): any => {
    if (typeof value === 'string') {
      const steps: TransformStep[] = [];
      let current = value;
      let depth = 0;
      const maxDepth = options?.maxDepth ?? 5;

      while (depth < maxDepth) {
        // 尝试 Unicode 解码
        const unicodeDecoded = tryUnicodeDecode(current);
        if (unicodeDecoded !== current) {
          steps.push({ type: 'unicode_decode' });
          current = unicodeDecoded;
        }

        // 尝试 JSON 解析
        try {
          const jsonParsed = JSON.parse(current);
          if (typeof jsonParsed === 'object' && jsonParsed !== null) {
            steps.push({ type: 'json_parse' });
            // 递归处理解析后的对象
            const processed = processObject(jsonParsed, currentPath);
            
            // 记录该路径的转换
            if (steps.length > 0) {
              context.records.set(currentPath, {
                path: currentPath,
                steps: [...steps],
                originalValue: value,
              });
            }
            return processed;
          }
          break;
        } catch {
          break;
        }
        depth++;
      }

      // 即使只有 Unicode 解码，也需要记录
      if (steps.length > 0) {
        context.records.set(currentPath, {
          path: currentPath,
          steps,
          originalValue: value,
        });
        return current;
      }
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item, index) => 
        processValue(item, `${currentPath}[${index}]`)
      );
    }

    if (typeof value === 'object' && value !== null) {
      return processObject(value, currentPath);
    }

    return value;
  };

  const processObject = (obj: any, basePath: string): any => {
    const result: any = {};
    for (const key in obj) {
      const childPath = `${basePath}.${key}`;
      result[key] = processValue(obj[key], childPath);
    }
    return result;
  };

  const output = processValue(parsed, '$');
  
  return {
    output: JSON.stringify(output, null, 2),
    context,
  };
}
```

#### 2. 基于上下文的精确还原

```typescript
function inverseWithContext(
  editedOutput: string,
  context: TransformContext
): string {
  const editedParsed = JSON.parse(editedOutput);

  const restoreValue = (value: any, currentPath: string): any => {
    const record = context.records.get(currentPath);

    if (record && record.steps.length > 0) {
      // 有转换记录，需要逆向还原
      let current = value;

      // 如果当前是对象/数组，先递归处理子节点，再序列化
      if (typeof current === 'object' && current !== null) {
        current = restoreObject(current, currentPath);
      }

      // 逆序执行转换步骤
      const reversedSteps = [...record.steps].reverse();
      for (const step of reversedSteps) {
        current = applyInverseStep(current, step);
      }

      return current;
    }

    // 无转换记录，递归处理子节点
    if (Array.isArray(value)) {
      return value.map((item, index) =>
        restoreValue(item, `${currentPath}[${index}]`)
      );
    }

    if (typeof value === 'object' && value !== null) {
      return restoreObject(value, currentPath);
    }

    return value;
  };

  const restoreObject = (obj: any, basePath: string): any => {
    const result: any = {};
    for (const key in obj) {
      const childPath = `${basePath}.${key}`;
      result[key] = restoreValue(obj[key], childPath);
    }
    return result;
  };

  const result = restoreValue(editedParsed, '$');

  // 检测原始缩进格式
  const indentation = detectIndentation(/* originalInput */);
  return JSON.stringify(result, null, indentation);
}

function applyInverseStep(value: any, step: TransformStep): any {
  switch (step.type) {
    case 'json_parse':
      // 逆操作：stringify
      return JSON.stringify(value);
    case 'unicode_decode':
      // 逆操作：encode
      return unicodeEncode(value);
    case 'url_decode':
      return encodeURIComponent(value);
    case 'base64_decode':
      return btoa(value);
    // ... 其他类型
    default:
      return value;
  }
}
```

---

## 实现计划

### Phase 1：基础架构 (修复线上问题) ✅ 优先

**目标**：建立转换路径记录机制，修复深度格式化还原问题

**改动文件**：
```
frontend/src/types.ts                    # 新增类型定义
frontend/src/utils/transformations.ts    # 重构核心转换逻辑
frontend/src/App.tsx                     # 适配新的转换 API
```

**具体步骤**：

1. **新增类型定义** (`types.ts`)
   - `TransformStep` - 单步转换
   - `PathTransformRecord` - 路径转换记录
   - `TransformContext` - 转换上下文
   - `TransformResult` - 带上下文的转换结果

2. **重构转换逻辑** (`transformations.ts`)
   - `deepParseWithContext()` - 带路径记录的深度解析
   - `inverseWithContext()` - 基于上下文的精确还原
   - 保持 `performTransform()` API 兼容，内部切换实现

3. **适配 App.tsx**
   - 存储 `TransformContext` 到组件状态
   - 在 `handleOutputChange` 中传入 context 进行还原

**验证场景**：
- [x] 嵌套 JSON 字符串的还原
- [x] Unicode 编码字符串的还原
- [x] 混合场景（JSON + Unicode）的还原
- [x] 用户修改后的精确还原

### Phase 2：扩展到 Scheme 解析

**目标**：基于 Phase 1 架构，支持 Deep Link 等 Scheme 字符串

**新增 TransformStep 类型**：
- `scheme_extract` - 提取 scheme 和 payload
- `url_decode` - URL 解码
- `base64_decode` - Base64 解码
- `jwt_decode` - JWT 解析

**新增转换模式**：
- `TransformMode.SCHEME_DECODE` - Scheme 深度解析

---

## 问题背景（补充）

在实际开发中，JSON 数据经常包含带有 scheme 的长字符串值，例如：

```json
{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
  "deepLink": "myapp://action?params=eyJuYW1lIjoiYWJjIiwiZGF0YSI6IntcInR5cGVcIjoxfSJ9",
  "callback": "https://api.example.com/callback?data=%7B%22user%22%3A%22test%22%2C%22token%22%3A%22xxx%22%7D"
}
```

### 痛点分析

| 痛点 | 说明 |
|------|------|
| **可读性差** | Scheme 字符串通常非常长，难以在编辑器中阅读 |
| **多层编码** | URL编码、Base64、嵌套JSON可能同时存在 |
| **手动解码繁琐** | 需要先识别编码类型，再逐层解码 |
| **编辑后难以还原** | 修改后需要按原编码方式重新编码 |

### 典型场景

1. **Data URI** - `data:image/png;base64,...` / `data:application/json,...`
2. **Deep Link** - `myapp://path?param=<encoded_json>`
3. **Callback URL** - `https://...?data=<url_encoded_json>`
4. **JWT Token** - `eyJhbGciOiJIUzI1NiIs...` (Header.Payload.Signature)
5. **自定义协议** - `custom-scheme://...`

---

## 方案设计

### 核心思路：智能检测 + 递归解码 + 可逆编辑

```
┌─────────────────────────────────────────────────────────────────┐
│                    Scheme 字符串处理流程                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   原始 JSON ──► 检测 Scheme ──► 递归解码 ──► 可视化展示          │
│                                     │                           │
│                                     ▼                           │
│                              用户编辑内容                        │
│                                     │                           │
│                                     ▼                           │
│   输出 JSON ◄── 递归编码 ◄── 检测原始格式 ◄───┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 功能模块

#### 1. Scheme 检测器 (SchemeDetector)

自动识别字符串中包含的 scheme 类型：

```typescript
interface SchemeInfo {
  type: 'data-uri' | 'url' | 'jwt' | 'base64' | 'url-encoded' | 'plain';
  scheme?: string;        // 如 "data:", "https:", "myapp:"
  mimeType?: string;      // 如 "image/png", "application/json"
  encoding?: string;      // 如 "base64", "utf-8"
  payload: string;        // 实际数据部分
  nested?: SchemeInfo;    // 嵌套的 scheme（递归）
}
```

检测优先级：
1. Data URI: `/^data:([^;,]+)?(?:;([^,]+))?,(.*)$/`
2. JWT: `/^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/`
3. URL with params: `/^[a-z][a-z0-9+.-]*:\/\//i`
4. URL encoded: `/%[0-9A-Fa-f]{2}/`
5. Base64: `/^[A-Za-z0-9+/]+=*$/` (长度 > 20)

#### 2. 编解码引擎 (CodecEngine)

支持的编解码类型：

| 类型 | 编码方法 | 解码方法 |
|------|----------|----------|
| URL 编码 | `encodeURIComponent()` | `decodeURIComponent()` |
| Base64 | `btoa()` / `Buffer.from().toString('base64')` | `atob()` / `Buffer.from(s, 'base64')` |
| Base64URL | 同上 + URL安全字符替换 | 同上 |
| Unicode | `\uXXXX` 转换 | Unicode 解析 |
| JSON 字符串 | `JSON.stringify()` | `JSON.parse()` |

#### 3. 递归解析器 (RecursiveParser)

核心逻辑：层层剥离编码，直到无法继续解码

```typescript
function deepDecodeScheme(input: string, maxDepth = 5): DecodedResult {
  const layers: DecodeLayer[] = [];
  let current = input;
  let depth = 0;

  while (depth < maxDepth) {
    const detected = detectScheme(current);
    if (detected.type === 'plain') break;

    layers.push({
      encoding: detected.type,
      before: current,
    });

    const decoded = decode(current, detected.type);
    if (decoded === current) break; // 无法继续解码

    current = decoded;
    depth++;
  }

  return {
    original: input,
    decoded: current,
    layers,
    isJson: isValidJson(current),
  };
}
```

#### 4. 可视化展示 (SchemeViewer)

展示方式设计：

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔗 Scheme String Viewer                                    [×]  │
├─────────────────────────────────────────────────────────────────┤
│ 路径: $.callback                                                │
│ 原始长度: 156 字符                                               │
├─────────────────────────────────────────────────────────────────┤
│ 解码层级:                                                       │
│   Layer 1: URL Encoded → URL Decoded                            │
│   Layer 2: JSON String → JSON Object                            │
├─────────────────────────────────────────────────────────────────┤
│ 解码结果 (可编辑):                                               │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ {                                                           │ │
│ │   "user": "test",                                           │ │
│ │   "token": "xxx"                                            │ │
│ │ }                                                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ [还原为原始格式] [复制解码结果] [应用到 JSON]                     │
└─────────────────────────────────────────────────────────────────┘
```

#### 5. 智能还原器 (SmartEncoder)

用户编辑后，按原始编码层级逆向重新编码：

```typescript
function smartEncode(edited: string, layers: DecodeLayer[]): string {
  let result = edited;
  
  // 逆序遍历解码层，依次重新编码
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];
    result = encode(result, layer.encoding);
  }
  
  return result;
}
```

---

## 用户交互设计

### 方案 A：自动检测 + 悬浮提示

- 编辑器自动检测长字符串中的 scheme
- 在行尾显示图标提示（如 🔗）
- 点击图标弹出解码查看器

**优点**：无侵入，按需使用  
**缺点**：用户可能不知道有此功能

### 方案 B：新增转换模式

在现有工具栏增加 "Scheme 解析" 转换模式：

```
[格式化] [压缩] [深度格式化] [转义] [🆕 Scheme解析]
```

点击后：
1. 扫描整个 JSON，找出所有包含 scheme 的字符串
2. 在右侧输出区展示解码后的结构化视图
3. 支持编辑并还原

**优点**：与现有功能一致，易于发现  
**缺点**：全局操作，不够精细

### 方案 C：右键菜单 + JSONPath 定位

- 用户选中字符串值
- 右键菜单出现 "解析 Scheme 字符串"
- 弹出专用编辑器

**优点**：精确控制  
**缺点**：需要用户主动选择

### 推荐：方案 A + B 组合

- 自动检测提供发现入口
- 工具栏模式提供批量处理能力

---

## 技术实现规划

### Phase 1：基础能力 (MVP) ✅ 已完成

**目标**：支持最常见的编码类型

- [x] 新增 `schemeUtils.ts` 工具模块
- [x] 实现 URL 编码/解码
- [x] 实现 Base64 编码/解码
- [x] 实现 JWT 解析（只读）
- [x] 递归多层解码

**已完成文件改动**：
```
frontend/src/utils/schemeUtils.ts           # 新增 - Scheme 检测和编解码
frontend/src/components/SchemeViewerModal.tsx # 新增 - 解析弹窗组件
frontend/src/components/Editor.tsx          # 修改 - 添加行内图标
frontend/src/index.css                      # 修改 - 图标样式
frontend/src/App.tsx                        # 修改 - 处理编辑应用
```

### Phase 2：交互优化 ✅ 已完成

**目标**：提升用户体验

- [x] 编辑器内 scheme 行号旁显示眼睛图标 👁
- [x] 悬浮提示显示 scheme 类型
- [x] 专用 Scheme Viewer 弹窗组件
- [x] 显示解码层级路径
- [x] 支持复制解码结果
- [x] 支持编辑后应用修改（按原编码逆向还原）

### Phase 3：待实现

**目标**：覆盖更多场景

- [ ] 自定义 scheme 规则配置
- [ ] 支持 Protobuf Base64 解析（需 schema）
- [ ] 支持压缩格式（gzip base64）

---

## 示例场景

### 场景 1：Deep Link 参数解析

**输入**：
```json
{
  "deepLink": "myapp://open?data=eyJ1c2VySWQiOjEyMywiYWN0aW9uIjoicHVyY2hhc2UifQ%3D%3D"
}
```

**解码过程**：
```
1. 检测: URL with encoded params
2. URL Decode: eyJ1c2VySWQiOjEyMywiYWN0aW9uIjoicHVyY2hhc2UifQ==
3. 检测: Base64
4. Base64 Decode: {"userId":123,"action":"purchase"}
5. 检测: JSON
6. JSON Parse: { userId: 123, action: "purchase" }
```

**输出**：
```json
{
  "deepLink": {
    "__scheme__": "myapp://open",
    "__decoded__": {
      "userId": 123,
      "action": "purchase"
    },
    "__encoding__": ["url", "base64", "json"]
  }
}
```

### 场景 2：Data URI 内嵌 JSON

**输入**：
```json
{
  "config": "data:application/json;base64,eyJkZWJ1ZyI6dHJ1ZSwidmVyc2lvbiI6IjEuMC4wIn0="
}
```

**解码后**：
```json
{
  "debug": true,
  "version": "1.0.0"
}
```

### 场景 3：多层嵌套

**输入** (URL参数里包含 URL编码的 JSON，JSON里又有 Base64)：
```json
{
  "callback": "https://api.com?payload=%7B%22token%22%3A%22eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiYWRtaW4ifQ.signature%22%7D"
}
```

**解码层级**：
```
Layer 0: Original URL string
Layer 1: URL Decode → {"token":"eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiYWRtaW4ifQ.signature"}
Layer 2: JSON Parse → { token: "eyJhbGciOiJIUzI1NiJ9..." }
Layer 3: JWT Decode (payload) → { user: "admin" }
```

---

## 风险与注意事项

| 风险 | 应对措施 |
|------|----------|
| 误判普通字符串为 Base64 | 设置最小长度阈值 + 结合上下文判断 |
| 解码后内容过大导致卡顿 | 限制解码深度 + 大内容懒加载 |
| 二进制 Base64 无法展示 | 检测 MIME 类型，非文本类型只显示元信息 |
| 编码还原后与原始不完全一致 | 记录原始编码细节（如大小写、padding） |

---

## 状态管理方案

### 方案 A：组件状态存储（推荐）

```tsx
// App.tsx
const [transformContext, setTransformContext] = useState<TransformContext | null>(null);

// 正向转换时保存 context
const output = useMemo(() => {
  if (mode === TransformMode.DEEP_FORMAT) {
    const result = deepParseWithContext(input);
    setTransformContext(result.context);  // 保存上下文
    return result.output;
  }
  return performTransform(input, mode);
}, [input, mode]);

// 反向转换时使用 context
const handleOutputChange = (newVal: string) => {
  if (transformContext) {
    const restored = inverseWithContext(newVal, transformContext);
    setInput(restored);
  }
};
```

**优点**：简单直接，无额外依赖  
**缺点**：刷新页面后丢失

### 方案 B：与文件 Tab 绑定

将 `TransformContext` 存储在 `FileTab` 结构中：

```typescript
interface FileTab {
  // ... 现有字段
  transformContext?: TransformContext;  // 新增
}
```

**优点**：切换 Tab 时保留上下文  
**缺点**：增加 Tab 状态复杂度

### 推荐：方案 A + 按需持久化

- 默认使用组件状态
- 文件保存时可选择是否保存转换元数据（如 `.json.meta` 文件）

---

## 已确认的决策

1. ✅ **先修复线上问题**，再扩展 Scheme 解析
2. ✅ **聚焦 Deep Link 场景**，图片类暂不考虑
3. ✅ **转换路径记录**是核心架构

## 待确认

1. 是否需要持久化 `TransformContext`？（文件关闭后是否保留？）
2. Phase 1 完成后，Scheme 解析的 UI 交互方式？

---

## 下一步

请确认方案后，我将开始 **Phase 1** 实现：

1. 在 `types.ts` 新增类型定义
2. 重构 `transformations.ts` 核心逻辑
3. 适配 `App.tsx` 状态管理
4. 编写测试用例验证还原准确性
