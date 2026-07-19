import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const seoOrigin = 'https://jsonutils.markz.fun';
export const seoLastModified = '2026-07-20';

export const seoGuides = [
  {
    slug: 'json-formatter',
    shortTitle: 'JSON 格式化',
    title: '在线 JSON 格式化工具：美化、压缩与深度展开',
    description: '使用 JSONUtils 在线格式化 JSON：一键美化或压缩数据，校验语法，并可深度展开嵌套在字符串中的 JSON。常规处理在浏览器本地完成。',
    eyebrow: 'FORMAT · MINIFY · DEEP FORMAT',
    lead: '把紧凑、转义或层层嵌套的 JSON 转成可读结构，并在同一个工作区继续校验、修复和查询。',
    useCases: [
      '美化接口响应、日志片段和配置文件，统一缩进层级',
      '压缩 JSON，便于复制到请求参数或测试数据中',
      '深度展开字符串字段内再次编码的 JSON，减少手工反转义',
    ],
    steps: [
      '粘贴 JSON、拖入文件，或从已有标签页选择内容。',
      '选择“格式化”“深度格式化”或“压缩”，预览结构变化。',
      '确认校验状态后复制结果；重要数据建议先保留原始副本。',
    ],
    checks: [
      '格式化不会改变键和值的语义；数组顺序保持不变。',
      '深度格式化会尝试解析字符串中的 JSON，提交前应复核类型变化。',
      '常规格式化在浏览器本地完成，页面不会要求先上传文件。',
    ],
    example: {
      intro: '下面的 profile 是被转义成字符串的 JSON。普通格式化只整理外层；深度格式化会继续识别并展开这层字符串。',
      inputLabel: '输入：紧凑且包含嵌套 JSON 字符串',
      input: '{"user":{"id":7,"profile":"{\\"city\\":\\"杭州\\",\\"active\\":true}"}}',
      outputLabel: '预期：深度格式化后的可读结构',
      output: '{\n  "user": {\n    "id": 7,\n    "profile": {\n      "city": "杭州",\n      "active": true\n    }\n  }\n}',
    },
    troubleshooting: [
      ['点击格式化后仍是一行', '先查看校验状态。输入不是合法 JSON 时，格式化不会掩盖原始语法错误。'],
      ['字符串字段没有被展开', '改用“深度格式化”；普通格式化会按 JSON 语义保留字符串类型。'],
      ['结果里的反斜杠变少了', '检查是否启用了深度格式化，并确认该字段是否应该从字符串转换为对象。'],
    ],
    related: ['json-validator', 'json-repair', 'jsonpath'],
  },
  {
    slug: 'json-validator',
    shortTitle: 'JSON 校验',
    title: '在线 JSON 校验工具：定位语法错误与结构问题',
    description: '使用 JSONUtils 在线校验 JSON，快速发现缺少逗号、引号、括号不匹配等语法错误，并在编辑器中定位问题后继续修复或格式化。',
    eyebrow: 'VALIDATE · LOCATE · REVIEW',
    lead: '在提交接口、配置或测试数据之前检查 JSON 是否可解析，并把模糊的“解析失败”收敛成可定位的问题。',
    useCases: [
      '排查缺少逗号、引号或闭合括号造成的解析失败',
      '检查从日志、网页或聊天工具复制后混入的异常字符',
      '在格式化、JSONPath、Schema 校验之前确认输入有效',
    ],
    steps: [
      '把待检查内容放入左侧源编辑器。',
      '查看校验状态与错误提示，回到对应位置修正。',
      '校验通过后再执行格式化、Schema 校验或类型生成。',
    ],
    checks: [
      '语法校验回答“能否解析”，不等于业务字段一定正确。',
      '数字、布尔值和 null 与字符串不同，修复时不要只追求通过。',
      '业务约束请继续使用 JSON Schema 或服务端校验规则。',
    ],
    example: {
      intro: '对象属性之间缺少逗号是接口联调中最常见的解析错误之一。校验器应先指出问题位置，而不是直接猜测业务值。',
      inputLabel: '输入：name 字段后缺少逗号',
      input: '{\n  "name": "JSONUtils"\n  "enabled": true\n}',
      outputLabel: '预期：定位到第二个属性附近',
      output: '校验失败：在 "enabled" 前需要逗号。\n修正为：\n{\n  "name": "JSONUtils",\n  "enabled": true\n}',
    },
    troubleshooting: [
      ['错误位置看起来偏后一位', '解析器通常在遇到下一个非法 token 时才确认错误，请同时检查提示位置的前一个字段。'],
      ['校验通过但接口仍报错', '语法有效不等于字段符合业务契约，继续使用 JSON Schema 或服务端规则检查类型与必填项。'],
      ['复制内容后突然无法解析', '检查全角标点、不可见空格和智能引号；它们常来自文档或聊天工具。'],
    ],
    related: ['json-repair', 'json-formatter', 'json-schema'],
  },
  {
    slug: 'json-repair',
    shortTitle: 'JSON 修复',
    title: '在线 JSON 修复工具：修正常见语法错误',
    description: '使用 JSONUtils 修复缺少引号、逗号、括号不完整等常见 JSON 语法问题，先预览修复结果，再校验、格式化并人工确认数据语义。',
    eyebrow: 'REPAIR · PREVIEW · CONFIRM',
    lead: '让不完整或不规范的 JSON 重新变得可解析，同时把“自动修好”与“业务含义正确”分开确认。',
    useCases: [
      '修复从日志或大模型回复中复制出的近似 JSON',
      '处理单引号、尾随逗号、缺失引号等常见格式问题',
      '恢复被截断或手工编辑后括号不匹配的数据片段',
    ],
    steps: [
      '保留原始内容副本，再把异常 JSON 放入源编辑器。',
      '执行智能修复并逐项查看修复后的预览。',
      '重新校验和格式化；涉及金额、ID 或配置时逐字段复核。',
    ],
    checks: [
      '修复器会补全语法，但无法知道缺失字段的真实业务值。',
      '截断严重的数据可能只能恢复外层结构，不能还原遗失内容。',
      '任何自动结果都应在写回生产配置或数据库前人工确认。',
    ],
    example: {
      intro: '近似 JSON 常来自手写配置或大模型输出。修复器可以补齐标准语法，但不会替你判断字段值是否真实。',
      inputLabel: '输入：单引号、未加引号的键与尾随逗号',
      input: "{name: 'JSONUtils', enabled: true,}",
      outputLabel: '预期：可解析的标准 JSON',
      output: '{\n  "name": "JSONUtils",\n  "enabled": true\n}',
    },
    troubleshooting: [
      ['修复后字段数量变少', '回到原始副本检查截断位置；严重缺失的内容无法通过语法推断恢复。'],
      ['数字被修成了字符串', '不要直接写回生产数据，按接口契约逐字段核对类型。'],
      ['修复结果仍不通过', '先缩小到最外层可解析片段，再逐段补回内容，定位无法自动恢复的位置。'],
    ],
    related: ['json-validator', 'json-formatter', 'json-diff'],
  },
  {
    slug: 'jsonpath',
    shortTitle: 'JSONPath 查询',
    title: '在线 JSONPath 查询工具：筛选与定位 JSON 数据',
    description: '使用 JSONUtils 在线运行 JSONPath 表达式，从嵌套对象和数组中筛选目标字段、检查匹配结果，并配合树形导航理解复杂 JSON 结构。',
    eyebrow: 'QUERY · FILTER · NAVIGATE',
    lead: '不用反复折叠长文件，通过路径表达式直接找到深层字段、数组成员和满足条件的数据。',
    useCases: [
      '从接口响应中提取嵌套字段或数组元素',
      '验证自动化测试、采集规则和数据映射中的 JSONPath',
      '配合树形结构确认字段层级和实际数据类型',
    ],
    steps: [
      '先校验源 JSON，确保查询输入能够正常解析。',
      '打开 JSONPath 面板并输入表达式，观察匹配数量和结果。',
      '从简单路径逐步增加通配符、数组下标或过滤条件。',
    ],
    checks: [
      '先确认使用方支持的 JSONPath 方言，复杂语法可能存在差异。',
      '空结果不一定是错误，也可能是路径、大小写或类型不匹配。',
      '查询只用于定位和读取；修改数据前仍要确认目标范围。',
    ],
    example: {
      intro: '用数组通配符可以一次提取所有用户名称，先从简单路径验证层级，再增加过滤条件。',
      inputLabel: '输入 JSON 与查询表达式 $.users[*].name',
      input: '{\n  "users": [\n    {"name": "Ada", "active": true},\n    {"name": "Lin", "active": false}\n  ]\n}',
      outputLabel: '预期匹配结果',
      output: '[\n  "Ada",\n  "Lin"\n]',
    },
    troubleshooting: [
      ['表达式没有结果', '先确认键名大小写和数组层级，再用 $.users 验证上一级路径是否存在。'],
      ['过滤表达式在别处可用、这里不可用', '不同实现支持的 JSONPath 方言不同，优先使用基础路径、通配符和明确的数组下标。'],
      ['结果类型与预期不同', '单个匹配和多个匹配可能返回不同形态，接入脚本前先固定调用方需要的结果结构。'],
    ],
    related: ['json-formatter', 'json-validator', 'json-schema'],
  },
  {
    slug: 'json-diff',
    shortTitle: 'JSON 差异对比',
    title: '在线 JSON Diff 工具：对比结构与字段变化',
    description: '使用 JSONUtils 在线对比两份 JSON，识别新增、删除和修改的字段或数组内容，适合核对接口响应、配置版本和测试快照。',
    eyebrow: 'COMPARE · TRACE · REVIEW',
    lead: '把肉眼难以发现的结构变化转换成明确差异，快速回答“哪个字段变了、少了或新增了”。',
    useCases: [
      '核对接口发布前后的响应结构与字段值',
      '审查配置文件、测试快照或示例数据的版本变化',
      '比较修复前后的 JSON，确认自动处理没有误改关键值',
    ],
    steps: [
      '分别准备基准 JSON 和待比较 JSON，并先完成语法校验。',
      '打开差异对比面板，放入两份数据后执行比较。',
      '按新增、删除和修改类别检查差异，再回到源数据处理。',
    ],
    checks: [
      '数组顺序变化可能产生大量差异，需要结合业务语义判断。',
      '格式化空格不属于数据差异，先解析后比较更准确。',
      '敏感生产数据应先脱敏，常规比较过程在浏览器本地完成。',
    ],
    example: {
      intro: '下面两份接口响应只有状态和值不同。结构化 Diff 会忽略缩进，把变化聚焦到具体路径。',
      inputLabel: '输入：基准 JSON → 新 JSON',
      input: '基准：{"status":"pending","count":2}\n新值：{"status":"done","count":3,"cached":true}',
      outputLabel: '预期差异摘要',
      output: '~ $.status: "pending" → "done"\n~ $.count: 2 → 3\n+ $.cached: true',
    },
    troubleshooting: [
      ['数组出现大量变化', '先确认数组顺序是否有业务含义；仅排序变化也可能表现为多条元素差异。'],
      ['两边格式不同但没有差异', '这是正常结果：结构化对比关注解析后的键和值，不比较空格和换行。'],
      ['无法开始对比', '分别校验左右两份输入，任一侧语法无效都会阻止可靠的结构比较。'],
    ],
    related: ['json-repair', 'json-validator', 'json-schema'],
  },
  {
    slug: 'json-schema',
    shortTitle: 'JSON Schema',
    title: '在线 JSON Schema 校验与示例生成工具',
    description: '使用 JSONUtils 通过 JSON Schema 校验字段类型、必填项和结构约束，也可从 Schema 生成示例 JSON，辅助接口联调与测试数据准备。',
    eyebrow: 'SCHEMA · VALIDATE · GENERATE',
    lead: '在语法正确之上继续检查字段类型、必填项和嵌套结构，让接口约定变成可执行规则。',
    useCases: [
      '检查接口请求或响应是否符合约定的数据结构',
      '验证必填字段、类型、枚举和嵌套对象约束',
      '从现有 Schema 生成示例 JSON，用于联调和测试',
    ],
    steps: [
      '准备待校验 JSON 与对应的 JSON Schema。',
      '打开 Schema 面板，执行校验并逐条查看失败路径。',
      '按业务规范修正数据或 Schema，再重新运行校验。',
    ],
    checks: [
      '确认 Schema 草案版本与团队或服务端实现一致。',
      '语法有效的 Schema 仍可能遗漏业务规则，需要评审约束完整性。',
      '生成的示例用于起步，不代表真实或完整的生产数据。',
    ],
    example: {
      intro: 'Schema 可以把“id 必须是整数、name 必须存在”变成可重复执行的检查，而不仅是口头约定。',
      inputLabel: '输入：数据与最小 Schema',
      input: '数据：{"id":"7"}\nSchema：{"type":"object","required":["id","name"],"properties":{"id":{"type":"integer"},"name":{"type":"string"}}}',
      outputLabel: '预期：两条结构约束错误',
      output: '$.id 应为 integer，实际为 string\n$ 缺少必填字段 name',
    },
    troubleshooting: [
      ['合法数据被判失败', '核对 Schema 草案版本、format 支持和数字/字符串类型，避免把 "7" 当成整数 7。'],
      ['错误信息太多', '从最外层 type 和 required 开始修复；上层结构错误常会连带产生多条子字段错误。'],
      ['生成示例缺少真实值', '示例只根据约束构造占位数据，业务 ID、枚举语义和关联关系仍需人工补充。'],
    ],
    related: ['json-validator', 'json-to-typescript', 'jsonpath'],
  },
  {
    slug: 'json-to-typescript',
    shortTitle: 'JSON 转 TypeScript',
    title: '在线 JSON 转 TypeScript 类型工具',
    description: '使用 JSONUtils 从示例 JSON 生成 TypeScript 类型定义，识别对象、数组和常见字段类型，减少接口模型手写工作，并在接入前复核可选性与联合类型。',
    eyebrow: 'JSON · TYPESCRIPT · MODEL',
    lead: '从真实示例快速得到可编辑的 TypeScript 类型骨架，把接口联调中的机械录入变成一次生成和一次审查。',
    useCases: [
      '从接口响应样例生成 TypeScript interface 或类型骨架',
      '识别嵌套对象和数组元素，减少手工声明遗漏',
      '为前端联调、SDK 封装和测试数据建立初始模型',
    ],
    steps: [
      '提供具有代表性的有效 JSON，尽量覆盖不同字段形态。',
      '运行 TypeScript 类型生成并复制到项目中。',
      '根据接口契约补充可选字段、联合类型、命名和公共模型。',
    ],
    checks: [
      '单个样例无法证明字段是否可选，也可能漏掉 null 或其他类型。',
      '生成结果是类型起点，不替代 OpenAPI、Schema 或后端契约。',
      '接入前应执行项目自身的 TypeScript 检查和接口回归测试。',
    ],
    example: {
      intro: '生成器会从样例值推断基础类型和嵌套结构；样例没有覆盖的可选性必须回到接口契约确认。',
      inputLabel: '输入：包含对象数组的响应样例',
      input: '{\n  "requestId": "req_7",\n  "users": [{"id": 1, "name": "Ada"}]\n}',
      outputLabel: '预期 TypeScript 类型骨架',
      output: 'interface Root {\n  requestId: string;\n  users: User[];\n}\n\ninterface User {\n  id: number;\n  name: string;\n}',
    },
    troubleshooting: [
      ['字段被生成成必填', '单个样例无法证明可选性，请根据 OpenAPI、Schema 或多份响应手工添加 ?。'],
      ['数组元素类型不完整', '提供包含不同合法形态的代表样例，再复核是否应使用联合类型。'],
      ['类型名不符合项目规范', '生成后统一重命名根类型和公共模型；工具输出是起点，不替代项目代码规范。'],
    ],
    related: ['json-schema', 'json-validator', 'json-formatter'],
  },
];

export const seoGuideRoutes = [
  '/guides/',
  ...seoGuides.map((guide) => '/guides/' + guide.slug + '/'),
];

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const guideBySlug = new Map(seoGuides.map((guide) => [guide.slug, guide]));

const listMarkup = (items) => items
  .map((item) => '          <li>' + escapeHtml(item) + '</li>')
  .join('\n');

const relatedMarkup = (slugs) => slugs
  .map((slug) => {
    const guide = guideBySlug.get(slug);
    return '          <a class="related-link" href="/guides/' + guide.slug + '/"><span>' + escapeHtml(guide.shortTitle) + '</span><span aria-hidden="true">→</span></a>';
  })
  .join('\n');

const troubleshootingMarkup = (items) => items
  .map(([issue, solution]) => [
    '          <div class="troubleshooting-item">',
    '            <dt>' + escapeHtml(issue) + '</dt>',
    '            <dd>' + escapeHtml(solution) + '</dd>',
    '          </div>',
  ].join('\n'))
  .join('\n');

const cardMarkup = () => seoGuides
  .map((guide, index) => [
    '          <article class="guide-card">',
    '            <p class="card-index">0' + (index + 1) + '</p>',
    '            <h2><a href="/guides/' + guide.slug + '/">' + escapeHtml(guide.shortTitle) + '</a></h2>',
    '            <p>' + escapeHtml(guide.description) + '</p>',
    '            <a class="text-link" href="/guides/' + guide.slug + '/">查看指南 <span aria-hidden="true">→</span></a>',
    '          </article>',
  ].join('\n'))
  .join('\n');

function structuredData({ title, description, route, breadcrumbs }) {
  const url = seoOrigin + route;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': url + '#webpage',
        url,
        name: title,
        description,
        inLanguage: 'zh-CN',
        dateModified: seoLastModified,
        isPartOf: { '@id': seoOrigin + '/#website' },
        breadcrumb: { '@id': url + '#breadcrumb' },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': url + '#breadcrumb',
        itemListElement: breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: seoOrigin + crumb.route,
        })),
      },
    ],
  }, null, 2).replaceAll('<', '\\u003c');
}

function documentShell({ title, description, route, breadcrumbs, main }) {
  const canonical = seoOrigin + route;
  const breadcrumbLinks = breadcrumbs
    .map((crumb, index) => {
      const label = index === breadcrumbs.length - 1
        ? '<span aria-current="page">' + escapeHtml(crumb.name) + '</span>'
        : '<a href="' + crumb.route + '">' + escapeHtml(crumb.name) + '</a>';
      return '          <li>' + label + '</li>';
    })
    .join('\n');
  return [
    '<!doctype html>',
    '<html lang="zh-CN">',
    '<head>',
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    '  <meta name="description" content="' + escapeHtml(description) + '" />',
    '  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />',
    '  <link rel="canonical" href="' + canonical + '" />',
    '  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
    '  <link rel="stylesheet" href="/guides.css" />',
    '  <meta property="og:type" content="article" />',
    '  <meta property="og:locale" content="zh_CN" />',
    '  <meta property="og:site_name" content="JSONUtils" />',
    '  <meta property="og:title" content="' + escapeHtml(title) + '" />',
    '  <meta property="og:description" content="' + escapeHtml(description) + '" />',
    '  <meta property="og:url" content="' + canonical + '" />',
    '  <meta name="twitter:card" content="summary" />',
    '  <meta name="twitter:title" content="' + escapeHtml(title) + '" />',
    '  <meta name="twitter:description" content="' + escapeHtml(description) + '" />',
    '  <title>' + escapeHtml(title) + ' | JSONUtils</title>',
    '  <script type="application/ld+json">',
    structuredData({ title, description, route, breadcrumbs }),
    '  </script>',
    '</head>',
    '<body>',
    '  <a class="skip-link" href="#main">跳到正文</a>',
    '  <header class="site-header">',
    '    <a class="brand" href="/" aria-label="打开 JSONUtils 在线工具">',
    '      <img src="/logo.svg" alt="" width="34" height="34" />',
    '      <span>JSONUtils</span>',
    '    </a>',
    '    <nav aria-label="主要导航">',
    '      <a href="/">在线工具</a>',
    '      <a href="/guides/"' + (route === '/guides/' ? ' aria-current="page"' : '') + '>使用指南</a>',
    '    </nav>',
    '  </header>',
    '  <main id="main">',
    '    <nav class="breadcrumbs" aria-label="面包屑">',
    '      <ol>',
    breadcrumbLinks,
    '      </ol>',
    '    </nav>',
    main,
    '  </main>',
    '  <footer>',
    '    <p><strong>JSONUtils</strong> · 格式化、校验、修复与分析 JSON</p>',
    '    <a href="/">打开在线工具 <span aria-hidden="true">→</span></a>',
    '  </footer>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

function renderGuideHub() {
  const title = 'JSONUtils 使用指南：格式化、校验、修复与分析 JSON';
  const description = 'JSONUtils 使用指南按任务讲解 JSON 格式化、语法校验、智能修复、JSONPath 查询、差异对比、JSON Schema 校验和 TypeScript 类型生成。';
  const route = '/guides/';
  const breadcrumbs = [
    { name: 'JSONUtils', route: '/' },
    { name: '使用指南', route },
  ];
  const main = [
    '    <section class="hero hero-hub">',
    '      <p class="eyebrow">JSON WORKBENCH · GUIDES</p>',
    '      <h1>从原始 JSON 到可交付结果</h1>',
    '      <p class="lead">按你正在解决的任务进入：先让数据可解析，再格式化、查询、比较、约束或生成类型。每一页都说明操作路径、适用场景和需要人工确认的边界。</p>',
    '      <div class="hero-actions">',
    '        <a class="button" href="/">立即处理 JSON</a>',
    '        <a class="button button-secondary" href="/guides/json-validator/">先检查 JSON 语法</a>',
    '      </div>',
    '      <dl class="signal-grid">',
    '        <div><dt>7</dt><dd>个核心任务</dd></div>',
    '        <div><dt>Local</dt><dd>常规浏览器处理</dd></div>',
    '        <div><dt>0</dt><dd>登录门槛</dd></div>',
    '      </dl>',
    '    </section>',
    '    <section class="guide-index" aria-labelledby="guide-index-title">',
    '      <div class="section-heading">',
    '        <p class="eyebrow">TASK INDEX</p>',
    '        <h2 id="guide-index-title">选择你的 JSON 任务</h2>',
    '      </div>',
    '      <div class="guide-grid">',
    cardMarkup(),
    '      </div>',
    '    </section>',
    '    <section class="principles">',
    '      <div>',
    '        <p class="eyebrow">WORKFLOW</p>',
    '        <h2>先校验，再改变</h2>',
    '      </div>',
    '      <p>推荐顺序是保留原始副本、确认语法、预览变更、复核业务值。JSONUtils 能减少机械操作，但不会替你决定缺失字段、接口约定或生产数据的真实含义。</p>',
    '    </section>',
  ].join('\n');
  return documentShell({ title, description, route, breadcrumbs, main });
}

function renderGuide(guide) {
  const route = '/guides/' + guide.slug + '/';
  const breadcrumbs = [
    { name: 'JSONUtils', route: '/' },
    { name: '使用指南', route: '/guides/' },
    { name: guide.shortTitle, route },
  ];
  const main = [
    '    <article>',
    '      <header class="hero article-hero">',
    '        <p class="eyebrow">' + escapeHtml(guide.eyebrow) + '</p>',
    '        <h1>' + escapeHtml(guide.title) + '</h1>',
    '        <p class="lead">' + escapeHtml(guide.lead) + '</p>',
    '        <div class="hero-actions">',
    '          <a class="button" href="/">打开 JSONUtils</a>',
    '          <a class="button button-secondary" href="/guides/">查看全部指南</a>',
    '        </div>',
    '      </header>',
    '      <div class="article-grid">',
    '        <section>',
    '          <p class="section-number">01</p>',
    '          <h2>什么时候使用</h2>',
    '          <ul>',
    listMarkup(guide.useCases),
    '          </ul>',
    '        </section>',
    '        <section>',
    '          <p class="section-number">02</p>',
    '          <h2>操作步骤</h2>',
    '          <ol>',
    listMarkup(guide.steps),
    '          </ol>',
    '        </section>',
    '        <section class="review-section">',
    '          <p class="section-number">03</p>',
    '          <h2>结果检查</h2>',
    '          <ul class="check-list">',
    listMarkup(guide.checks),
    '          </ul>',
    '        </section>',
    '      </div>',
    '      <section class="worked-example" aria-labelledby="example-title">',
    '        <div class="section-heading">',
    '          <div>',
    '            <p class="section-number">04</p>',
    '            <h2 id="example-title">输入与预期结果</h2>',
    '          </div>',
    '          <p>' + escapeHtml(guide.example.intro) + '</p>',
    '        </div>',
    '        <div class="example-grid">',
    '          <figure>',
    '            <figcaption>' + escapeHtml(guide.example.inputLabel) + '</figcaption>',
    '            <pre><code>' + escapeHtml(guide.example.input) + '</code></pre>',
    '          </figure>',
    '          <figure>',
    '            <figcaption>' + escapeHtml(guide.example.outputLabel) + '</figcaption>',
    '            <pre><code>' + escapeHtml(guide.example.output) + '</code></pre>',
    '          </figure>',
    '        </div>',
    '      </section>',
    '      <section class="troubleshooting" aria-labelledby="troubleshooting-title">',
    '        <div class="section-heading">',
    '          <div>',
    '            <p class="section-number">05</p>',
    '            <h2 id="troubleshooting-title">常见问题排查</h2>',
    '          </div>',
    '          <p>先确认输入、所选工具和预期结果，再按下面的任务边界逐项排查。</p>',
    '        </div>',
    '        <dl>',
    troubleshootingMarkup(guide.troubleshooting),
    '        </dl>',
    '      </section>',
    '      <aside class="cta-panel">',
    '        <div>',
    '          <p class="eyebrow">READY TO WORK</p>',
    '          <h2>在浏览器里处理这份 JSON</h2>',
    '          <p>无需注册。打开工具后粘贴内容或导入文件，按指南完成处理。</p>',
    '        </div>',
    '        <a class="button" href="/">打开在线工具</a>',
    '      </aside>',
    '      <section class="related" aria-labelledby="related-title">',
    '        <div class="section-heading">',
    '          <p class="eyebrow">NEXT TASK</p>',
    '          <h2 id="related-title">继续处理</h2>',
    '        </div>',
    '        <div class="related-grid">',
    relatedMarkup(guide.related),
    '        </div>',
    '      </section>',
    '    </article>',
  ].join('\n');
  return documentShell({
    title: guide.title,
    description: guide.description,
    route,
    breadcrumbs,
    main,
  });
}

export function renderSeoSitemap() {
  const routes = ['/', ...seoGuideRoutes];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...routes.flatMap((route) => [
      '  <url>',
      '    <loc>' + seoOrigin + route + '</loc>',
      '    <lastmod>' + seoLastModified + '</lastmod>',
      '  </url>',
    ]),
    '</urlset>',
    '',
  ].join('\n');
}

export function expectedSeoFiles() {
  const files = new Map([
    ['public/guides/index.html', renderGuideHub()],
    ['public/sitemap.xml', renderSeoSitemap()],
  ]);
  for (const guide of seoGuides) {
    files.set('public/guides/' + guide.slug + '/index.html', renderGuide(guide));
  }
  return files;
}

export function collectSeoPageDrift(frontendDir, prefix = 'public') {
  const failures = [];
  for (const [relativeFile, expected] of expectedSeoFiles()) {
    const targetRelative = relativeFile.replace(/^public/, prefix);
    const target = path.join(frontendDir, targetRelative);
    if (!fs.existsSync(target)) {
      failures.push('frontend/' + targetRelative + ': 缺少生成的 SEO 页面');
    } else if (fs.readFileSync(target, 'utf8') !== expected) {
      failures.push('frontend/' + targetRelative + ': 与 SEO 页面生成器不一致');
    }
  }
  return failures;
}

export function writeSeoPages(frontendDir) {
  for (const [relativeFile, source] of expectedSeoFiles()) {
    const target = path.join(frontendDir, relativeFile);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, source);
  }
}

const isCli = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  if (process.argv.includes('--check')) {
    const failures = collectSeoPageDrift(frontendDir);
    if (failures.length > 0) {
      failures.forEach((failure) => console.error('- ' + failure));
      process.exitCode = 1;
    } else {
      console.log('JSONUtils SEO 指南页与 sitemap 均和生成器一致。');
    }
  } else {
    writeSeoPages(frontendDir);
    console.log('已生成 ' + seoGuideRoutes.length + ' 个 JSONUtils 指南页面与 sitemap。');
  }
}
