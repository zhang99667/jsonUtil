import {
  AI_EVOLUTION_LOOP_REFERENCES,
  SUBAGENT_DELEGATION_REFERENCES,
} from './aiGovernanceCollaborationReferenceGroups.mjs';

export const PLAYBOOK_SECTION_REFERENCE_RULES = [
  {
    sectionTitle: '### 0. 判断子 Agent 委派',
    contains: SUBAGENT_DELEGATION_REFERENCES,
  },
  {
    sectionTitle: '### 5. 规则进化闭环',
    contains: AI_EVOLUTION_LOOP_REFERENCES,
  },
];
