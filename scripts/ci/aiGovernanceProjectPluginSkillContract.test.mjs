import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import {
  collectProjectPluginSkillContractFailures,
  PROJECT_PLUGIN_SKILL_CONTRACT,
} from './aiGovernanceProjectPluginSkillContract.mjs';
import { discoverProjectPluginSkillFiles } from './aiGovernanceProjectPluginSkillDiscovery.mjs';
import { collectProjectPluginFailures } from './aiGovernanceProjectPlugins.mjs';
import {
  buildProjectPluginLock,
  collectProjectPluginLockFailures,
  PROJECT_PLUGIN_LOCK_PATH,
} from './aiGovernanceProjectPluginLock.mjs';
import { writeProjectPluginLockLifecycle } from './aiGovernanceProjectPluginLifecycle.mjs';
import {
  projectPluginEvalFile as evalFile,
  projectPluginManifestFile as manifestFile,
  projectPluginSkillFile as skillFile,
  projectPluginTestRoot as projectRoot,
  projectPluginUiFile as uiFile,
  rewriteProjectPluginJson as rewriteJson,
  rewriteProjectPluginText as rewriteText,
  withProjectPluginCopy as withCopy,
} from './aiGovernanceProjectPluginTestFixtures.mjs';

const rewriteLock = (root) => fs.writeFileSync(
  path.join(root, PROJECT_PLUGIN_LOCK_PATH),
  `${JSON.stringify(buildProjectPluginLock(root), null, 2)}\n`,
);

test('项目插件 skill 语义契约接受当前正例并暴露闭合 case identity', () => {
  assert.deepEqual(PROJECT_PLUGIN_SKILL_CONTRACT, {
    caseId: 'project-plugin-skill-semantic-contract-boundary',
    version: '1.7.0',
  });
  assert.equal(Object.isFrozen(PROJECT_PLUGIN_SKILL_CONTRACT), true);
  assert.deepEqual(collectProjectPluginSkillContractFailures(projectRoot), []);
});

test('项目插件 manifest 必须把 skills 指向固定插件目录', () => withCopy((root) => {
  rewriteJson(root, manifestFile, value => { value.skills = './other-skills/'; });
  assert.deepEqual(collectProjectPluginSkillContractFailures(root), [
    `${manifestFile}: 必须是稳定有界、闭字段、唯一键且类型有效的项目 plugin manifest`,
  ]);
}));

test('项目插件 manifest 与 SKILL 终点拒绝目录、symlink 和 dangling symlink', async () => {
  for (const [file, expected] of [
    [manifestFile, /plugin\.json: 必须是稳定有界、闭字段、唯一键且类型有效的项目 plugin manifest/],
    [skillFile, /SKILL\.md: 无法读取 skill|项目插件源码快照在 Skill 语义校验前无效/],
  ]) for (const kind of ['directory', 'symlink', 'dangling']) await withCopy((root) => {
    const absolute = path.join(root, file);
    const content = fs.readFileSync(absolute);
    fs.rmSync(absolute);
    if (kind === 'directory') fs.mkdirSync(absolute);
    else {
      const target = `${absolute}.real`;
      if (kind === 'symlink') fs.writeFileSync(target, content);
      fs.symlinkSync(path.basename(target), absolute);
    }
    assert.match(collectProjectPluginSkillContractFailures(root).join('\n'), expected);
  });
});

test('项目插件 manifest 与 SKILL 拒绝会被替换字符掩盖的非法 UTF-8', async () => {
  for (const [file, marker, expected] of [
    [manifestFile, 'Keyless', `${manifestFile}: 必须是稳定有界、闭字段、唯一键且类型有效的项目 plugin manifest`],
    [skillFile, '# Probe', `${skillFile}: 无法读取 skill`],
  ]) await withCopy((root) => {
    const absolute = path.join(root, file), bytes = fs.readFileSync(absolute), offset = bytes.indexOf(Buffer.from(marker)) + 1;
    fs.writeFileSync(absolute, Buffer.concat([bytes.subarray(0, offset), Buffer.from([0x80]), bytes.subarray(offset)]));
    assert.deepEqual(collectProjectPluginSkillContractFailures(root), [expected]);
  });
});

test('项目插件 Skill 发现拒绝零 Skill、异类入口和 symlink 根/祖先', async () => {
  const skillsRoot = path.posix.dirname(path.posix.dirname(skillFile));
  const cases = [
    [root => fs.rmSync(path.join(root, path.posix.dirname(skillFile)), { recursive: true }), /至少包含一个 skill 目录/],
    [root => fs.writeFileSync(path.join(root, skillsRoot, 'ignored.txt'), 'ignored'), /ignored\.txt: 必须是普通 skill 目录/],
    [root => {
      const skills = path.join(root, skillsRoot);
      fs.renameSync(skills, `${skills}-real`);
      fs.symlinkSync(`${skills}-real`, skills, 'dir');
    }, /必须是可读的普通 skills 目录|项目 plugin manifest/],
    [root => { const plugin = path.join(root, 'plugins/ai-infra-controller-probe'); fs.renameSync(plugin, `${plugin}-real`); fs.symlinkSync(`${plugin}-real`, plugin, 'dir'); }, /必须是可读的普通 skills 目录|项目 plugin manifest/],
  ];
  for (const [mutate, expected] of cases) await withCopy((root) => {
    mutate(root);
    assert.match(collectProjectPluginSkillContractFailures(root).join('\n'), expected);
  });
});

test('项目插件 Skill 发现按 UTF-8 字节序稳定返回全部目录', () => withCopy((root) => {
  const skillsRoot = path.join(root, path.posix.dirname(path.posix.dirname(skillFile)));
  for (const name of ['z-skill', 'a-skill', 'é-skill']) fs.mkdirSync(path.join(skillsRoot, name));
  assert.deepEqual(
    discoverProjectPluginSkillFiles(root).skillFiles.map(file => path.basename(path.dirname(file))),
    ['a-skill', 'probe-codex-controller-runtime', 'z-skill', 'é-skill'],
  );
}));

test('第二个 Skill 的 UI/eval companion 祖先 symlink 按固定顺序拒绝', () => withCopy((root) => {
  const secondSkill = 'plugins/ai-infra-controller-probe/skills/unsafe-skill';
  fs.cpSync(path.join(root, path.posix.dirname(skillFile)), path.join(root, secondSkill), { recursive: true });
  rewriteText(root, `${secondSkill}/SKILL.md`, content => content.replace(/^name:.*$/m, 'name: unsafe-skill'));
  rewriteText(root, `${secondSkill}/agents/openai.yaml`, content => content.replaceAll('probe-codex-controller-runtime', 'unsafe-skill'));
  rewriteJson(root, `${secondSkill}/evals/evals.json`, value => { value.skill_name = 'unsafe-skill'; });
  for (const directory of ['agents', 'evals']) {
    const absolute = path.join(root, secondSkill, directory);
    fs.renameSync(absolute, `${absolute}-real`);
    fs.symlinkSync(`${directory}-real`, absolute, 'dir');
  }
  assert.deepEqual(collectProjectPluginSkillContractFailures(root), [
    `${secondSkill}/agents/openai.yaml: 必须是可读的非 symlink 普通文件`,
    `${secondSkill}/evals/evals.json: 必须是可读的非 symlink 普通文件`,
  ]);
}));

test('项目插件 skill UI 与 eval companion 均为必需资产', () => withCopy((root) => {
  fs.rmSync(path.join(root, uiFile));
  fs.rmSync(path.join(root, evalFile));
  assert.deepEqual(collectProjectPluginSkillContractFailures(root), [
    `${uiFile}: 缺少 skill UI metadata`,
    `${evalFile}: 缺少必需 evals/evals.json`,
  ]);
}));

test('项目插件 skill 语义契约拒绝缺失 frontmatter、空字段和目录错配', async () => {
  const cases = [
    [content => content.replace(/^---[\s\S]*?---\r?\n/, ''), `${skillFile}: 缺少 skill frontmatter`],
    [content => content.replace(/^name:.*$/m, 'name:'), `${skillFile}: frontmatter name 不能为空`],
    [content => content.replace(/^description:.*$/m, 'description:'), `${skillFile}: frontmatter description 不能为空`],
    [content => content.replace(/^name:.*$/m, 'name: wrong-skill'), `${skillFile}: frontmatter name 必须等于 skill 目录名 probe-codex-controller-runtime`],
    [content => content.replace(/^name:.*$/m, match => `${match}\n${match}`), `${skillFile}: frontmatter 不允许重复顶层字段 name`],
    [content => content.replace(/^name:.*$/m, match => `${match}\n"name": wrong-skill`), `${skillFile}: frontmatter 顶层 key 必须使用 plain mapping`],
    [content => content.replace(/^description:.*$/m, match => `${match}\nmetadata:\n  version: "1.0.0"\n  version: "9.9.9"`), `${skillFile}: frontmatter metadata 不允许重复字段 version`],
    [content => content.replace(/^description:.*$/m, match => `${match}\nmetadata:\n version: "1.0.0"\n version: "9.9.9"`), `${skillFile}: frontmatter metadata 不允许重复字段 version`],
    [content => content.replace(/^description:.*$/m, match => `${match}\nmetadata:\n  version: "1.0.0"\n version: "9.9.9"`), `${skillFile}: frontmatter metadata key 必须使用 plain mapping`],
    [content => content.replace(/^description:.*$/m, match => `${match}\nmetadata:\n  "version": "1.0.0"`), `${skillFile}: frontmatter metadata key 必须使用 plain mapping`],
    [content => content.replace(/^description:.*$/m, 'description: *missing'), `${skillFile}: frontmatter description 必须是 1-1024 字符的字符串`],
    [content => content.replace(/^description:.*$/m, 'description: 0xFF'), `${skillFile}: frontmatter description 必须是 1-1024 字符的字符串`],
    [content => content.replace(/^description:.*$/m, 'description: "Probe\\ncontroller runtime"'), `${skillFile}: frontmatter description 必须是 1-1024 字符的字符串`],
  ];
  for (const [mutate, expected] of cases) await withCopy((root) => {
    rewriteText(root, skillFile, mutate);
    assert.deepEqual(collectProjectPluginSkillContractFailures(root), [expected]);
  });
});

test('项目插件 skill UI 必须拒绝解码后的多行默认提示', () => withCopy((root) => {
  rewriteText(root, uiFile, content => content.replace('$probe-codex-controller-runtime', '\\n$probe-codex-controller-runtime'));
  assert.deepEqual(collectProjectPluginSkillContractFailures(root), [
    `${uiFile}: default_prompt 必须显式引用 $probe-codex-controller-runtime`,
  ]);
}));

test('项目插件主 collector 拒绝冲突 policy authority', () => withCopy((root) => {
  rewriteText(root, uiFile, content => content.replace(
    /^  default_prompt:.*$/m,
    match => `${match}\npolicy:\n  allow_implicit_invocation: false\n  allow_implicit_invocation: true`,
  ));
  rewriteLock(root);
  assert.match(
    collectProjectPluginFailures(root, { checkEntryVersions: false }).join('\n'),
    /openai\.yaml: policy 不允许重复字段 allow_implicit_invocation/,
  );
}));

test('项目插件 skill eval 的 skill_name 必须匹配目录', () => withCopy((root) => {
  rewriteJson(root, evalFile, value => { value.skill_name = 'wrong-skill'; });
  assert.deepEqual(collectProjectPluginSkillContractFailures(root), [
    `${evalFile}: skill_name 必须与 skill 目录名一致`,
  ]);
}));

test('项目插件 skill eval 拒绝重复 prompt', () => withCopy((root) => {
  rewriteJson(root, evalFile, value => { value.evals[1].prompt = value.evals[0].prompt; });
  assert.deepEqual(collectProjectPluginSkillContractFailures(root), [
    `${evalFile}: prompt 必须唯一`,
  ]);
}));

test('项目插件 skill eval 拒绝空 assertions', () => withCopy((root) => {
  rewriteJson(root, evalFile, value => { value.evals[0].assertions = []; });
  assert.deepEqual(collectProjectPluginSkillContractFailures(root), [
    'evals[0].assertions 必须是非空字符串数组',
  ]);
}));

test('同步 content lock 不能把组合语义错误伪装成合法插件', () => withCopy((root) => {
  rewriteText(root, skillFile, content => content.replace(/^name:.*$/m, 'name: wrong-skill'));
  rewriteText(root, uiFile, content => content.replace('$probe-codex-controller-runtime', '$wrong-skill'));
  rewriteJson(root, evalFile, (value) => {
    value.skill_name = 'wrong-skill';
    value.evals[0].assertions = [];
    value.evals[1].prompt = value.evals[0].prompt;
  });
  rewriteLock(root);

  assert.deepEqual(collectProjectPluginLockFailures(root), []);
  assert.deepEqual(collectProjectPluginSkillContractFailures(root), [
    `${skillFile}: frontmatter name 必须等于 skill 目录名 probe-codex-controller-runtime`,
    `${uiFile}: default_prompt 必须显式引用 $probe-codex-controller-runtime`,
    `${evalFile}: skill_name 必须与 skill 目录名一致`,
    'evals[0].assertions 必须是非空字符串数组',
    `${evalFile}: prompt 必须唯一`,
  ]);
}));

test('lock writer 在版本递增后仍拒绝封存第二个非法 Skill', () => withCopy(async (root) => {
  const lockFile = path.join(root, PROJECT_PLUGIN_LOCK_PATH);
  const secondSkill = 'plugins/ai-infra-controller-probe/skills/unsafe-skill';
  rewriteJson(root, manifestFile, (value) => {
    value.version = '0.5.1';
  });
  fs.cpSync(path.join(root, path.posix.dirname(skillFile)), path.join(root, secondSkill), { recursive: true });
  rewriteText(root, `${secondSkill}/SKILL.md`, content => content
    .replace(/^name:.*$/m, 'name: unsafe-skill')
    .replace(/^description:.*$/m, 'description: *missing'));
  rewriteText(root, `${secondSkill}/agents/openai.yaml`, content => content
    .replaceAll('probe-codex-controller-runtime', 'unsafe-skill'));
  rewriteJson(root, `${secondSkill}/evals/evals.json`, value => { value.skill_name = 'unsafe-skill'; });
  rewriteLock(root);
  assert.deepEqual(collectProjectPluginLockFailures(root), []);
  const beforeWrite = fs.readFileSync(lockFile, 'utf8');
  let inventoryCalls = 0;
  const report = await writeProjectPluginLockLifecycle({
    rootDir: root,
    listInventory: async () => (inventoryCalls += 1, new Set()),
  });

  assert.equal(report.status, 'blocked');
  assert.deepEqual(report.failures, ['PROJECT_PLUGIN_SOURCE_CONTRACT_INVALID']);
  assert.equal(inventoryCalls, 0);
  assert.equal(fs.readFileSync(lockFile, 'utf8'), beforeWrite);
}));
