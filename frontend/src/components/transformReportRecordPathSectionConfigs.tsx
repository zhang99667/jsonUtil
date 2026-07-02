import React from 'react';
import type { TransformReportRecord } from '../utils/transformSummary';
import { formatDecodedPathCount } from './TransformReportPanelAtoms';
import type { TransformReportRecordPathActions } from './TransformReportRecordSectionContracts';
import type { TransformReportRecordPathRowsProps } from './TransformReportRecordPathRows';

export const buildNestedCommandPathSectionProps = (
  record: TransformReportRecord,
  callbacks: TransformReportRecordPathActions
): TransformReportRecordPathRowsProps | null => (
  record.nestedCommandFields.length > 0
    ? {
        title: '内部CMD字段',
        rows: record.nestedCommandFields,
        countLabel: `${record.nestedCommandFieldCount} 个`,
        rowKeyPrefix: `${record.path}:cmd-field`,
        sectionDataTour: 'transform-report-nested-cmd-fields',
        rowDataTour: 'transform-report-nested-cmd-field',
        copyPathDataTour: 'transform-report-copy-nested-cmd-path',
        copyValueDataTour: 'transform-report-copy-nested-cmd-value',
        locateDataTour: 'transform-report-locate-nested-cmd-path',
        schemeDataTour: 'transform-report-open-nested-cmd-scheme',
        rowClassName: 'flex items-center gap-2 rounded bg-cyan-950/20 px-2 py-1',
        pathClassName: 'min-w-0 flex-1 text-emerald-200 truncate',
        valueClassName: 'min-w-0 flex-1 text-cyan-200 truncate',
        ...callbacks,
        moreContent: record.hasMoreNestedCommandFields && (
          <>
            还有更多内部 CMD 字段未展示
            {record.indexedNestedCommandFieldCount > record.nestedCommandFields.length && (
              <span>，已索引 {record.indexedNestedCommandFieldCount} 个，可搜索字段名或 schema 展示隐藏项</span>
            )}
          </>
        ),
      }
    : null
);

export const buildNestedResourcePathSectionProps = (
  record: TransformReportRecord,
  callbacks: TransformReportRecordPathActions
): TransformReportRecordPathRowsProps | null => (
  record.nestedResourceFields?.length
    ? {
        title: '静态资源字段',
        rows: record.nestedResourceFields,
        countLabel: `${record.nestedResourceFieldCount || 0} 个`,
        rowKeyPrefix: `${record.path}:resource-field`,
        sectionDataTour: 'transform-report-nested-resource-fields',
        rowDataTour: 'transform-report-nested-resource-field',
        copyPathDataTour: 'transform-report-copy-nested-resource-path',
        copyValueDataTour: 'transform-report-copy-nested-resource-value',
        locateDataTour: 'transform-report-locate-nested-resource-path',
        rowClassName: 'flex items-center gap-2 rounded bg-slate-900/30 px-2 py-1',
        pathClassName: 'min-w-0 flex-1 text-slate-100 truncate',
        valueClassName: 'min-w-0 flex-1 text-slate-300 truncate',
        onCopyPath: callbacks.onCopyPath,
        onCopyDecodedPathValue: callbacks.onCopyDecodedPathValue,
        onLocatePath: callbacks.onLocatePath,
        moreContent: record.hasMoreNestedResourceFields && (
          <>
            还有更多静态资源字段未展示
            {(record.indexedNestedResourceFieldCount || 0) > record.nestedResourceFields.length && (
              <span>，已索引 {record.indexedNestedResourceFieldCount} 个，可搜索字段名或 URL 展示隐藏项</span>
            )}
          </>
        ),
      }
    : null
);

export const buildDecodedPathSectionProps = (
  record: TransformReportRecord,
  callbacks: TransformReportRecordPathActions
): TransformReportRecordPathRowsProps | null => (
  record.decodedPaths.length > 0
    ? {
        title: '内部路径',
        rows: record.decodedPaths,
        countLabel: `${formatDecodedPathCount(record)} 条`,
        rowKeyPrefix: record.path,
        rowDataTour: 'transform-report-decoded-path',
        copyPathDataTour: 'transform-report-copy-decoded-path',
        copyValueDataTour: 'transform-report-copy-decoded-value',
        locateDataTour: 'transform-report-locate-decoded-path',
        moreDataTour: 'transform-report-more-decoded-paths',
        rowClassName: 'flex items-center gap-2 rounded bg-editor-bg px-2 py-1',
        pathClassName: 'min-w-0 flex-1 text-emerald-200 truncate',
        valueClassName: 'min-w-0 flex-1 text-cyan-200 truncate',
        onCopyPath: callbacks.onCopyPath,
        onCopyDecodedPathValue: callbacks.onCopyDecodedPathValue,
        onLocatePath: callbacks.onLocatePath,
        moreContent: record.hasMoreDecodedPaths && (
          <>
            还有更多内部路径未展示，总计 {formatDecodedPathCount(record)} 条
            {record.indexedDecodedPathCount > record.decodedPaths.length && (
              <span>，已索引 {record.indexedDecodedPathCount} 条，可搜索字段名展示隐藏路径</span>
            )}
          </>
        ),
      }
    : null
);

export const buildTransformReportRecordPathSections = (
  record: TransformReportRecord,
  callbacks: TransformReportRecordPathActions
): TransformReportRecordPathRowsProps[] => (
  [
    buildNestedCommandPathSectionProps(record, callbacks),
    buildNestedResourcePathSectionProps(record, callbacks),
    buildDecodedPathSectionProps(record, callbacks),
  ].filter((section): section is TransformReportRecordPathRowsProps => section !== null)
);
