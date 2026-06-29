import React from 'react';
import type { TransformReportRecord } from '../utils/transformSummary';
import { formatDecodedPathCount } from './TransformReportPanelAtoms';
import { TransformReportRecordPathRows } from './TransformReportRecordPathRows';

interface TransformReportRecordPathSectionsProps {
  record: TransformReportRecord;
  onCopyPath: (path: string, successMessage?: string) => void | Promise<void>;
  onCopyDecodedPathValue: (text: string) => void | Promise<void>;
  onLocatePath?: (path: string) => void;
  onOpenSchemeValue?: (value: string) => void;
}

export const TransformReportRecordPathSections: React.FC<TransformReportRecordPathSectionsProps> = ({
  record,
  onCopyPath,
  onCopyDecodedPathValue,
  onLocatePath,
  onOpenSchemeValue,
}) => (
  <>
    {record.nestedCommandFields.length > 0 && (
      <TransformReportRecordPathRows
        title="内部CMD字段"
        rows={record.nestedCommandFields}
        countLabel={`${record.nestedCommandFieldCount} 个`}
        rowKeyPrefix={`${record.path}:cmd-field`}
        sectionDataTour="transform-report-nested-cmd-fields"
        rowDataTour="transform-report-nested-cmd-field"
        copyPathDataTour="transform-report-copy-nested-cmd-path"
        copyValueDataTour="transform-report-copy-nested-cmd-value"
        locateDataTour="transform-report-locate-nested-cmd-path"
        schemeDataTour="transform-report-open-nested-cmd-scheme"
        rowClassName="flex items-center gap-2 rounded bg-cyan-950/20 px-2 py-1"
        pathClassName="min-w-0 flex-1 text-emerald-200 truncate"
        valueClassName="min-w-0 flex-1 text-cyan-200 truncate"
        onCopyPath={onCopyPath}
        onCopyDecodedPathValue={onCopyDecodedPathValue}
        onLocatePath={onLocatePath}
        onOpenSchemeValue={onOpenSchemeValue}
        moreContent={record.hasMoreNestedCommandFields && (
          <>
            还有更多内部 CMD 字段未展示
            {record.indexedNestedCommandFieldCount > record.nestedCommandFields.length && (
              <span>
                ，已索引 {record.indexedNestedCommandFieldCount} 个，可搜索字段名或 schema 展示隐藏项
              </span>
            )}
          </>
        )}
      />
    )}
    {Boolean(record.nestedResourceFields?.length) && (
      <TransformReportRecordPathRows
        title="静态资源字段"
        rows={record.nestedResourceFields || []}
        countLabel={`${record.nestedResourceFieldCount || 0} 个`}
        rowKeyPrefix={`${record.path}:resource-field`}
        sectionDataTour="transform-report-nested-resource-fields"
        rowDataTour="transform-report-nested-resource-field"
        copyPathDataTour="transform-report-copy-nested-resource-path"
        copyValueDataTour="transform-report-copy-nested-resource-value"
        locateDataTour="transform-report-locate-nested-resource-path"
        rowClassName="flex items-center gap-2 rounded bg-slate-900/30 px-2 py-1"
        pathClassName="min-w-0 flex-1 text-slate-100 truncate"
        valueClassName="min-w-0 flex-1 text-slate-300 truncate"
        onCopyPath={onCopyPath}
        onCopyDecodedPathValue={onCopyDecodedPathValue}
        onLocatePath={onLocatePath}
        moreContent={record.hasMoreNestedResourceFields && (
          <>
            还有更多静态资源字段未展示
            {(record.indexedNestedResourceFieldCount || 0) > (record.nestedResourceFields?.length || 0) && (
              <span>
                ，已索引 {record.indexedNestedResourceFieldCount} 个，可搜索字段名或 URL 展示隐藏项
              </span>
            )}
          </>
        )}
      />
    )}
    {record.decodedPreview && (
      <div className="mt-1 font-mono text-cyan-200 truncate" title={record.decodedPreview}>
        解析结果: {record.decodedPreview}
      </div>
    )}
    {record.decodedPaths.length > 0 && (
      <TransformReportRecordPathRows
        title="内部路径"
        rows={record.decodedPaths}
        countLabel={`${formatDecodedPathCount(record)} 条`}
        rowKeyPrefix={record.path}
        rowDataTour="transform-report-decoded-path"
        copyPathDataTour="transform-report-copy-decoded-path"
        copyValueDataTour="transform-report-copy-decoded-value"
        locateDataTour="transform-report-locate-decoded-path"
        moreDataTour="transform-report-more-decoded-paths"
        rowClassName="flex items-center gap-2 rounded bg-editor-bg px-2 py-1"
        pathClassName="min-w-0 flex-1 text-emerald-200 truncate"
        valueClassName="min-w-0 flex-1 text-cyan-200 truncate"
        onCopyPath={onCopyPath}
        onCopyDecodedPathValue={onCopyDecodedPathValue}
        onLocatePath={onLocatePath}
        moreContent={record.hasMoreDecodedPaths && (
          <>
            还有更多内部路径未展示，总计 {formatDecodedPathCount(record)} 条
            {record.indexedDecodedPathCount > record.decodedPaths.length && (
              <span>
                ，已索引 {record.indexedDecodedPathCount} 条，可搜索字段名展示隐藏路径
              </span>
            )}
          </>
        )}
      />
    )}
    <div className="mt-1 font-mono text-gray-500 truncate" title={record.originalPreview}>
      原始值: {record.originalPreview}
    </div>
  </>
);
