import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectSkillUiContractFailures } from './aiGovernanceCodexSkillUiContract.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const skillFile = '.agents/skills/example-skill/SKILL.md';
const uiFile = '.agents/skills/example-skill/agents/openai.yaml';
const interfaceLines = [
  'interface:',
  '  display_name: "Example Skill"',
  '  short_description: "Run a focused example skill workflow"',
  '  default_prompt: "Use $example-skill to complete this task."',
];

const collectUiFailures = lines => withAiGovernanceTempRoot((rootDir) => {
  writeFixtureFile(rootDir, uiFile, `${lines.join('\n')}\n`);
  return collectSkillUiContractFailures(rootDir, skillFile);
});

test('Skill UI 允许官方 optional interface、policy 与 dependencies', () => {
  assert.deepEqual(collectUiFailures([
    'interface:',
    "  display_name: 'Example Skill' # 展示名",
    '  short_description: "Run\\x20a focused example skill workflow"',
    '  icon_small: "./assets/icon-small.svg"',
    '  icon_large: "./assets/icon-large.png"',
    '  brand_color: "#2563EB"',
    "  default_prompt: 'Use $example-skill to complete this task.'",
    'policy:',
    '  allow_implicit_invocation: false',
    'dependencies:',
    '  tools:',
    '    - type: "mcp"',
    '      value: "example"',
    '      description: "Example MCP server"',
    '      transport: "streamable_http"',
    '      url: "https://example.invalid/mcp"',
    'x_project_note: |',
    '  ---',
  ]), []);
});

test('Skill UI 拒绝重复映射、多文档与转义后的伪长度', () => {
  const cases = [
    {
      lines: [...interfaceLines, 'interface:', '  display_name: "Shadow Skill"'],
      expected: /openai\.yaml: 不允许重复顶层字段 interface/,
    },
    {
      lines: [...interfaceLines, '  default_prompt: "Use $wrong-skill to complete this task."'],
      expected: /openai\.yaml: interface 不允许重复字段 default_prompt/,
    },
    {
      lines: [...interfaceLines, '  "default_prompt": "Use $wrong-skill to complete this task."'],
      expected: /openai\.yaml: interface key 必须使用 plain mapping/,
    },
    {
      lines: interfaceLines.map(line => line.replace(': "', ':"')),
      expected: /openai\.yaml: interface key 必须使用 plain mapping/,
    },
    {
      lines: [...interfaceLines, ' default_prompt: "Use $wrong-skill to complete this task."'],
      expected: /openai\.yaml: interface key 必须使用 plain mapping/,
    },
    {
      lines: [...interfaceLines, '---', 'interface:', '  display_name: "Shadow Skill"'],
      expected: /openai\.yaml: 必须是单一隐式 YAML document/,
    },
    {
      lines: [
        'interface:',
        '  display_name: "Example Skill"',
        '  short_description: "\\u0041\\u0041\\u0041\\u0041\\u0041"',
        '  default_prompt: "Use $example-skill-shadow to complete this task."',
      ],
      expected: /short_description 必须是 25-64 字符/,
    },
    {
      lines: [
        'interface:',
        '  display_name: "Example\\nSkill"',
        '  short_description: "Run\\u000Aa focused example skill workflow"',
        '  default_prompt: "Use\\L$example-skill to complete this task."',
      ],
      expected: /display_name 必须[^\n]*\n[^\n]*short_description 必须[^\n]*\n[^\n]*default_prompt 必须/,
    },
  ];
  for (const { lines, expected } of cases) {
    assert.match(collectUiFailures(lines).join('\n'), expected);
  }
});

test('Skill UI policy 必须是唯一 plain mapping 且 invocation 开关为 boolean', () => {
  const cases = [
    {
      lines: [...interfaceLines, 'policy: []'],
      expected: /policy 必须是 block mapping/,
    },
    {
      lines: [...interfaceLines, 'policy:', '  allow_implicit_invocation: false', '  allow_implicit_invocation: true'],
      expected: /policy 不允许重复字段 allow_implicit_invocation/,
    },
    {
      lines: [...interfaceLines, 'policy:', '  "allow_implicit_invocation": false'],
      expected: /policy key 必须使用 plain mapping/,
    },
    ...['"false"', '0', 'disabled'].map(value => ({
      lines: [...interfaceLines, 'policy:', `  allow_implicit_invocation: ${value}`],
      expected: /allow_implicit_invocation 必须是 true 或 false/,
    })),
  ];
  for (const { lines, expected } of cases) {
    assert.match(collectUiFailures(lines).join('\n'), expected);
  }
});

test('Skill UI dependencies 必须是唯一有界 tools sequence', () => {
  const cases = [
    {
      lines: [...interfaceLines, 'dependencies: invalid'],
      expected: /dependencies 必须是 block mapping/,
    },
    {
      lines: [...interfaceLines, 'dependencies:', '  tools: []'],
      expected: /dependencies\.tools 必须是非空 block sequence/,
    },
    {
      lines: [...interfaceLines, 'dependencies:', '  tools:', '    - type: "mcp"', '      value: "one"', '  tools:', '    - type: "mcp"', '      value: "two"'],
      expected: /dependencies 不允许重复字段 tools/,
    },
    {
      lines: [...interfaceLines, 'dependencies:', '  tools:', '    - type: "mcp"', '      value: "one"', '      value: "two"'],
      expected: /dependencies\.tools\[0\] 不允许重复字段/,
    },
    {
      lines: [...interfaceLines, 'dependencies:', '  tools:', '    - type: "http"', '      value: "one"'],
      expected: /dependencies\.tools\[0\] type 必须精确等于 mcp/,
    },
    {
      lines: [...interfaceLines, 'dependencies:', '  tools:', '    - type: "mcp"'],
      expected: /dependencies\.tools\[0\] value 必须是非空引号字符串/,
    },
  ];
  for (const { lines, expected } of cases) {
    assert.match(collectUiFailures(lines).join('\n'), expected);
  }
});
