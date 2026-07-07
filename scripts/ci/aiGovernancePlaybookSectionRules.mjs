import {
  AI_EVOLUTION_LOOP_REFERENCES,
  SUBAGENT_DELEGATION_REFERENCES,
} from './aiGovernanceCollaborationReferenceGroups.mjs';
import { AI_SAFETY_BOUNDARY_REFERENCES } from './aiGovernanceAiBoundaryReferenceGroups.mjs';

export const PLAYBOOK_SECTION_REFERENCE_RULES = [
  {
    sectionTitle: '### 0. 判断子 Agent 委派',
    contains: SUBAGENT_DELEGATION_REFERENCES,
  },
  {
    sectionTitle: '### 3. 编码约束',
    contains: AI_SAFETY_BOUNDARY_REFERENCES,
  },
  {
    sectionTitle: '### 5. 规则进化闭环',
    contains: AI_EVOLUTION_LOOP_REFERENCES,
  },
];
