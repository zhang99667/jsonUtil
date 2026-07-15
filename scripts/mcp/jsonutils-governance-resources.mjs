import fs from 'node:fs';
import path from 'node:path';

const resources = [
  ['jsonutils://ai-governance/playbook', 'AI Engineering Playbook', 'docs/AI-ENGINEERING-PLAYBOOK.md'],
  ['jsonutils://ai-governance/asset-registry', 'AI Asset Registry', 'docs/AI-ASSET-REGISTRY.md'],
  ['jsonutils://ai-governance/decisions', 'AI Governance Decisions', 'docs/AI-GOVERNANCE-DECISIONS.md'],
  ['jsonutils://ai-governance/maintainer-skill', 'JSONUtils Maintainer Skill', '.agents/skills/jsonutils-maintainer/SKILL.md'],
].map(([uri, name, file]) => ({
  uri,
  name,
  description: `JSONUtils ${name}`,
  mimeType: 'text/markdown',
  file,
}));

export const listJsonutilsGovernanceResources = () => ({
  resources: resources.map(({ file, ...resource }) => resource),
});

export const readJsonutilsGovernanceResource = (uri, rootDir) => {
  const resource = resources.find(item => item.uri === uri);
  if (!resource) throw new Error(`Unknown resource: ${uri}`);
  return {
    contents: [{
      uri,
      mimeType: resource.mimeType,
      text: fs.readFileSync(path.join(rootDir, resource.file), 'utf8'),
    }],
  };
};
