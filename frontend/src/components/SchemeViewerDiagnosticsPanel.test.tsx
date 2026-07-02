import { describe, expect, it, vi } from 'vitest';
import { SchemeViewerBase64MetaPanel } from './SchemeViewerBase64MetaPanel';
import { SchemeViewerCommandSummaryPanel } from './SchemeViewerCommandSummaryPanel';
import { SchemeViewerDecodeLayersPanel } from './SchemeViewerDecodeLayersPanel';
import { SchemeViewerDecodeWarningsPanel } from './SchemeViewerDecodeWarningsPanel';
import { SchemeViewerDiagnosticsQualityCard } from './SchemeViewerDiagnosticsQualityCard';
import { SchemeViewerDiagnosticsSummaryBar } from './SchemeViewerDiagnosticsSummaryBar';
import {
  commandSummaryInfo,
  decodeWarnings,
  paramSections,
  paramStages,
  placeholderGroups,
  placeholders,
  qualitySummary,
  renderSchemeViewerDiagnosticsPanel,
} from './SchemeViewerDiagnosticsPanelTestFixture';
import { SchemeViewerParamSectionsPanel } from './SchemeViewerParamSectionsPanel';
import { SchemeViewerParamStagesPanel } from './SchemeViewerParamStagesPanel';
import { SchemeViewerRuntimePlaceholdersPanel } from './SchemeViewerRuntimePlaceholdersPanel';
import { SchemeViewerSchemeInfoRow } from './SchemeViewerSchemeInfoRow';
import {
  findByTour,
  findByTypeOrNull,
} from './schemeViewerElementTestHelpers';

const renderPanel = renderSchemeViewerDiagnosticsPanel;

describe('SchemeViewerDiagnosticsPanel', () => {
  it('没有诊断详情时不渲染', () => {
    expect(renderPanel({ hasDiagnosticDetails: false })).toBeNull();
  });

  it('折叠态渲染摘要并透传展开回调', () => {
    const onToggleExpanded = vi.fn();
    const tree = renderPanel({ isExpanded: false, onToggleExpanded });
    const summaryBar = findByTypeOrNull(tree, SchemeViewerDiagnosticsSummaryBar);

    expect(findByTour(tree, 'scheme-diagnostics-panel')).toHaveLength(1);
    expect(summaryBar?.props).toMatchObject({
      isExpanded: false,
      onToggleExpanded,
      schemeQualitySummary: qualitySummary,
    });
    expect(findByTour(tree, 'scheme-quality-summary')).toHaveLength(0);
  });

  it('展开态渲染质量摘要、警告和操作按钮', () => {
    const onInspectOriginal = vi.fn();
    const onCopyQualitySummary = vi.fn();
    const onCopyQualitySnapshot = vi.fn();
    const tree = renderPanel({
      onInspectOriginal,
      onCopyQualitySummary,
      onCopyQualitySnapshot,
    });
    const qualityCard = findByTypeOrNull(tree, SchemeViewerDiagnosticsQualityCard);
    const warningsPanel = findByTypeOrNull(tree, SchemeViewerDecodeWarningsPanel);

    expect(qualityCard?.props).toMatchObject({
      schemeQualitySummary: qualitySummary,
      canInspectOriginal: true,
      onInspectOriginal,
      onCopyQualitySummary,
      onCopyQualitySnapshot,
    });
    expect(warningsPanel?.props.decodeWarnings).toBe(decodeWarnings);
    expect(findByTypeOrNull(tree, SchemeViewerSchemeInfoRow)?.props.schemeInfo).toMatchObject({
      protocol: 'baiduboxapp:',
      host: 'v7',
      path: '/vendor/ad/prerender',
    });
  });

  it('透传各个诊断子面板的数据', () => {
    const tree = renderPanel();

    expect(findByTypeOrNull(tree, SchemeViewerCommandSummaryPanel)?.props.commandSummaryInfo).toBe(commandSummaryInfo);
    expect(findByTypeOrNull(tree, SchemeViewerRuntimePlaceholdersPanel)?.props).toMatchObject({
      placeholders,
      placeholderGroups,
    });
    expect(findByTypeOrNull(tree, SchemeViewerParamSectionsPanel)?.props.paramSections).toBe(paramSections);
    expect(findByTypeOrNull(tree, SchemeViewerParamStagesPanel)?.props.paramStages).toBe(paramStages);
    expect(findByTypeOrNull(tree, SchemeViewerBase64MetaPanel)?.props.base64MetaInfo).toBeNull();
    expect(findByTypeOrNull(tree, SchemeViewerDecodeLayersPanel)?.props).toMatchObject({
      decodedContent: '{"a":1}',
      isJson: true,
    });
  });
});
