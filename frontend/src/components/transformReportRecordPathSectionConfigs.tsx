import React from 'react';
import type { TransformReportRecord } from '../utils/transformSummary';
import { formatDecodedPathCount } from './TransformReportPanelAtoms';
import type { TransformReportRecordPathActions } from './TransformReportRecordSectionContracts';
import {
  buildIndexedMoreContent,
  buildStyledPathSectionProps,
} from './transformReportRecordPathSectionHelpers';
import type { TransformReportRecordPathRowsProps } from './TransformReportRecordPathRows';

export const buildNestedCommandPathSectionProps = (
  record: TransformReportRecord,
  callbacks: TransformReportRecordPathActions
): TransformReportRecordPathRowsProps | null => (
  buildStyledPathSectionProps(record.nestedCommandFields, callbacks, 'command', true, {
    title: '内部CMD字段',
    countLabel: `${record.nestedCommandFieldCount} 个`,
    rowKeyPrefix: `${record.path}:cmd-field`,
    sectionDataTour: 'transform-report-nested-cmd-fields',
    rowDataTour: 'transform-report-nested-cmd-field',
    copyPathDataTour: 'transform-report-copy-nested-cmd-path',
    copyValueDataTour: 'transform-report-copy-nested-cmd-value',
    locateDataTour: 'transform-report-locate-nested-cmd-path',
    schemeDataTour: 'transform-report-open-nested-cmd-scheme',
    moreContent: buildIndexedMoreContent(
      record.hasMoreNestedCommandFields,
      '还有更多内部 CMD 字段未展示',
      record.indexedNestedCommandFieldCount,
      record.nestedCommandFields.length,
      '个，可搜索字段名或 schema 展示隐藏项'
    ),
  })
);

export const buildNestedResourcePathSectionProps = (
  record: TransformReportRecord,
  callbacks: TransformReportRecordPathActions
): TransformReportRecordPathRowsProps | null => (
  buildStyledPathSectionProps(record.nestedResourceFields, callbacks, 'resource', false, {
    title: '静态资源字段',
    countLabel: `${record.nestedResourceFieldCount || 0} 个`,
    rowKeyPrefix: `${record.path}:resource-field`,
    sectionDataTour: 'transform-report-nested-resource-fields',
    rowDataTour: 'transform-report-nested-resource-field',
    copyPathDataTour: 'transform-report-copy-nested-resource-path',
    copyValueDataTour: 'transform-report-copy-nested-resource-value',
    locateDataTour: 'transform-report-locate-nested-resource-path',
    moreContent: buildIndexedMoreContent(
      Boolean(record.hasMoreNestedResourceFields),
      '还有更多静态资源字段未展示',
      record.indexedNestedResourceFieldCount || 0,
      record.nestedResourceFields?.length || 0,
      '个，可搜索字段名或 URL 展示隐藏项'
    ),
  })
);

export const buildDecodedPathSectionProps = (
  record: TransformReportRecord,
  callbacks: TransformReportRecordPathActions
): TransformReportRecordPathRowsProps | null => (
  buildStyledPathSectionProps(record.decodedPaths, callbacks, 'decoded', false, {
    title: '内部路径',
    countLabel: `${formatDecodedPathCount(record)} 条`,
    rowKeyPrefix: record.path,
    rowDataTour: 'transform-report-decoded-path',
    copyPathDataTour: 'transform-report-copy-decoded-path',
    copyValueDataTour: 'transform-report-copy-decoded-value',
    locateDataTour: 'transform-report-locate-decoded-path',
    moreDataTour: 'transform-report-more-decoded-paths',
    moreContent: buildIndexedMoreContent(
      record.hasMoreDecodedPaths,
      <>还有更多内部路径未展示，总计 {formatDecodedPathCount(record)} 条</>,
      record.indexedDecodedPathCount,
      record.decodedPaths.length,
      '条，可搜索字段名展示隐藏路径'
    ),
  })
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
