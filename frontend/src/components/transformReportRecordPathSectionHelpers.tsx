import type { TransformReportDecodedPath } from '../utils/transformSummary';
import type { TransformReportRecordPathActions } from './TransformReportRecordSectionContracts';
import type { TransformReportRecordPathRowsProps } from './TransformReportRecordPathRows';

type PathSectionBaseProps = Omit<TransformReportRecordPathRowsProps, 'rows'>;
type PathSectionStaticProps = Omit<PathSectionBaseProps, keyof TransformReportRecordPathActions | keyof PathSectionRowStyles>;
type PathSectionRowStyles = Pick<TransformReportRecordPathRowsProps, 'rowClassName' | 'pathClassName' | 'valueClassName'>;

export const pathSectionStyles = {
  command: {
    rowClassName: 'flex items-center gap-2 rounded bg-cyan-950/20 px-2 py-1',
    pathClassName: 'min-w-0 flex-1 text-emerald-200 truncate',
    valueClassName: 'min-w-0 flex-1 text-cyan-200 truncate',
  },
  resource: {
    rowClassName: 'flex items-center gap-2 rounded bg-slate-900/30 px-2 py-1',
    pathClassName: 'min-w-0 flex-1 text-slate-100 truncate',
    valueClassName: 'min-w-0 flex-1 text-slate-300 truncate',
  },
  decoded: {
    rowClassName: 'flex items-center gap-2 rounded bg-editor-bg px-2 py-1',
    pathClassName: 'min-w-0 flex-1 text-emerald-200 truncate',
    valueClassName: 'min-w-0 flex-1 text-cyan-200 truncate',
  },
} satisfies Record<string, PathSectionRowStyles>;

export const pickCopyLocateActions = (callbacks: TransformReportRecordPathActions) => ({
  onCopyPath: callbacks.onCopyPath,
  onCopyDecodedPathValue: callbacks.onCopyDecodedPathValue,
  onLocatePath: callbacks.onLocatePath,
});

export const buildPathSectionProps = (
  rows: TransformReportDecodedPath[] | undefined,
  props: PathSectionBaseProps
): TransformReportRecordPathRowsProps | null => (rows?.length ? { ...props, rows } : null);

export const buildStyledPathSectionProps = (
  rows: TransformReportDecodedPath[] | undefined,
  callbacks: TransformReportRecordPathActions,
  style: keyof typeof pathSectionStyles,
  includeSchemeAction: boolean,
  props: PathSectionStaticProps
): TransformReportRecordPathRowsProps | null => buildPathSectionProps(rows, {
  ...props,
  ...pathSectionStyles[style],
  ...(includeSchemeAction ? callbacks : pickCopyLocateActions(callbacks)),
});
