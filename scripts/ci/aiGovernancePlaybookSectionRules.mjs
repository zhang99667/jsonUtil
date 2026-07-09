import {
  AI_EVOLUTION_LOOP_REFERENCES,
  SUBAGENT_DELEGATION_REFERENCES,
} from './aiGovernanceCollaborationReferenceGroups.mjs';
import { AI_SAFETY_BOUNDARY_REFERENCES } from './aiGovernanceAiBoundaryReferenceGroups.mjs';

const REQUIRED_LEDGER_READING_REFERENCES = ['docs/AI-ASSET-REGISTRY.md', 'docs/AI-GOVERNANCE-DECISIONS.md'];
const sectionRule = (sectionTitle, contains) => ({ sectionTitle, contains });

export const PLAYBOOK_SECTION_REFERENCE_RULES = [
  sectionRule('## 必读顺序', REQUIRED_LEDGER_READING_REFERENCES),
  sectionRule('### 0. 判断子 Agent 委派', SUBAGENT_DELEGATION_REFERENCES),
  sectionRule('### 3. 编码约束', AI_SAFETY_BOUNDARY_REFERENCES),
  sectionRule('### 5. 规则进化闭环', AI_EVOLUTION_LOOP_REFERENCES),
];

export const AI_TOOLS_SETUP_SECTION_REFERENCE_RULES = [
  sectionRule('## 必读顺序', REQUIRED_LEDGER_READING_REFERENCES),
];
