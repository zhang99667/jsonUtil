import { transformPlaceholderFillMaintainabilityBudgets } from './maintainability-budget-transform-placeholder-fill-rules.mjs';
import { transformPlaceholderSuggestionMaintainabilityBudgets } from './maintainability-budget-transform-placeholder-suggestion-rules.mjs';

export const transformPlaceholderMaintainabilityBudgets = [
  ...transformPlaceholderSuggestionMaintainabilityBudgets,
  ...transformPlaceholderFillMaintainabilityBudgets,
];
