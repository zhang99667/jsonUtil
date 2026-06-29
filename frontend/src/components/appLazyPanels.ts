import { lazy } from 'react';

export const LazySchemeViewerModal = lazy(() => import('./SchemeViewerModal').then(module => ({
  default: module.SchemeViewerModal,
})));

export const LazyJsonPathPanel = lazy(() => import('./JsonPathPanel').then(module => ({
  default: module.JsonPathPanel,
})));

export const LazyJsonTreePanel = lazy(() => import('./JsonTreePanel').then(module => ({
  default: module.JsonTreePanel,
})));

export const LazyJsonComparePanel = lazy(() => import('./JsonComparePanel').then(module => ({
  default: module.JsonComparePanel,
})));

export const LazyJsonSchemaPanel = lazy(() => import('./JsonSchemaPanel').then(module => ({
  default: module.JsonSchemaPanel,
})));

export const LazyTemplateFillPanel = lazy(() => import('./TemplateFillPanel').then(module => ({
  default: module.TemplateFillPanel,
})));

export const LazyUnifiedSettingsModal = lazy(() => import('./UnifiedSettingsModal').then(module => ({
  default: module.UnifiedSettingsModal,
})));

export const LazyAiRepairSummaryBanner = lazy(() => import('./AiRepairSummaryBanner').then(module => ({
  default: module.AiRepairSummaryBanner,
})));

export const LazyTransformReportPanel = lazy(() => import('./TransformReportPanel').then(module => ({
  default: module.TransformReportPanel,
})));

export const LazyChangelogModal = lazy(() => import('./ChangelogModal').then(module => ({
  default: module.ChangelogModal,
})));
