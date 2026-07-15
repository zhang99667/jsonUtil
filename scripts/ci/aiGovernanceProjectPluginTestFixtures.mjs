import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const projectPluginTestRoot = path.resolve(import.meta.dirname, '../..');
export const projectPluginManifestFile = 'plugins/ai-infra-controller-probe/.codex-plugin/plugin.json';
export const projectPluginSkillFile = 'plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/SKILL.md';
export const projectPluginUiFile = 'plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/agents/openai.yaml';
export const projectPluginEvalFile = 'plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/evals/evals.json';

const makeWritable = (target) => {
  const stat = fs.lstatSync(target);
  if (stat.isDirectory() && !stat.isSymbolicLink()) {
    fs.chmodSync(target, 0o700);
    fs.readdirSync(target).forEach(name => makeWritable(path.join(target, name)));
  } else if (!stat.isSymbolicLink()) fs.chmodSync(target, 0o600);
};

export const withProjectPluginCopy = async (run) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-project-plugin-contract-'));
  try {
    fs.cpSync(path.join(projectPluginTestRoot, '.agents'), path.join(root, '.agents'), { recursive: true });
    fs.cpSync(path.join(projectPluginTestRoot, 'plugins'), path.join(root, 'plugins'), { recursive: true });
    makeWritable(root);
    return await run(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};

export const rewriteProjectPluginText = (root, file, mutate) => {
  const absolute = path.join(root, file);
  fs.writeFileSync(absolute, mutate(fs.readFileSync(absolute, 'utf8')));
};

export const rewriteProjectPluginJson = (root, file, mutate) => {
  const absolute = path.join(root, file);
  const value = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  mutate(value);
  fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
};
