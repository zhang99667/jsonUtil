import { appTemplateFillComponentMaintainabilityBudgets } from './maintainability-budget-app-template-fill-component-rules.mjs';
import { appTemplateFillModelMaintainabilityBudgets } from './maintainability-budget-app-template-fill-model-rules.mjs';

export const appTemplateFillMaintainabilityBudgets = [
  ...appTemplateFillComponentMaintainabilityBudgets,
  ...appTemplateFillModelMaintainabilityBudgets,
];
