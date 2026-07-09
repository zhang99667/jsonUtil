const entryTargets = label => [['AGENTS.md', `${label} `], ['CLAUDE.md', `${label} `]];

const npmVersionFact = (name, packageName, targets) => ({
  name,
  packageName,
  sourceFile: 'frontend/package.json',
  sourceKind: 'npm',
  targets,
});

export const VERSION_FACTS = [
  npmVersionFact('React', 'react', [...entryTargets('React'), ['rules/code-style.md', '| 框架 | React | ']]),
  npmVersionFact('Vite', 'vite', [...entryTargets('Vite'), ['rules/code-style.md', '| 构建工具 | Vite | ']]),
  npmVersionFact('TypeScript', 'typescript', [...entryTargets('TypeScript'), ['rules/code-style.md', '| 语言 | TypeScript | ']]),
  npmVersionFact('Tailwind CSS', 'tailwindcss', [...entryTargets('Tailwind CSS'), ['rules/code-style.md', '| UI 组件库 | Tailwind CSS | ']]),
  npmVersionFact('Ant Design', 'antd', [...entryTargets('Ant Design'), ['rules/code-style.md', '| 管理后台 UI | Ant Design | ']]),
  npmVersionFact('@monaco-editor/react', '@monaco-editor/react', [
    ...entryTargets('@monaco-editor/react'),
    ['rules/code-style.md', '| 编辑器封装 | @monaco-editor/react | '],
  ]),
  { name: 'Spring Boot', sourceFile: 'backend/pom.xml', sourceKind: 'springBootMajor', targets: [...entryTargets('Spring Boot'), ['rules/code-style.md', '| 框架 | Spring Boot | ']] },
  { name: 'Java', sourceFile: 'backend/pom.xml', sourceKind: 'javaMajor', targets: [...entryTargets('Java'), ['rules/code-style.md', '| 语言 | Java | ']] },
];

export const UNVERIFIABLE_VERSION_FACTS = [
  {
    file: 'rules/code-style.md',
    snippet: '| 编辑器 | Monaco Editor | 最新 |',
    message: 'rules/code-style.md: Monaco 编辑器版本事实使用不可验证的 "最新"',
  },
  {
    file: 'rules/code-style.md',
    snippet: '| 桌面封装 | Electron | 最新 |',
    message: 'rules/code-style.md: Electron 版本事实使用不可验证的 "最新"',
  },
];
