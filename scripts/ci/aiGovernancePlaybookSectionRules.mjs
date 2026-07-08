import {
  AI_EVOLUTION_LOOP_REFERENCES,
  SUBAGENT_DELEGATION_REFERENCES,
} from './aiGovernanceCollaborationReferenceGroups.mjs';
import { AI_SAFETY_BOUNDARY_REFERENCES } from './aiGovernanceAiBoundaryReferenceGroups.mjs';

const PLAYBOOK_REQUIRED_READING_REFERENCES = ['docs/AI-ASSET-REGISTRY.md', 'docs/AI-GOVERNANCE-DECISIONS.md'];
const playbookSectionRule = (sectionTitle, contains) => ({ sectionTitle, contains });

export const PLAYBOOK_SECTION_REFERENCE_RULES = [
  playbookSectionRule('## 必读顺序', PLAYBOOK_REQUIRED_READING_REFERENCES),
  playbookSectionRule('### 0. 判断子 Agent 委派', SUBAGENT_DELEGATION_REFERENCES),
  playbookSectionRule('### 3. 编码约束', AI_SAFETY_BOUNDARY_REFERENCES),
  playbookSectionRule('### 5. 规则进化闭环', AI_EVOLUTION_LOOP_REFERENCES),
];
