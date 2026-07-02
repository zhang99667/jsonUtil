import React from 'react';
import type { TransformReportRecord } from '../utils/transformSummary';
import { buildTransformReportRecordPathSections } from './transformReportRecordPathSectionConfigs';
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
}) => {
  const sections = buildTransformReportRecordPathSections(record, {
    onCopyPath,
    onCopyDecodedPathValue,
    onLocatePath,
    onOpenSchemeValue,
  });

  return (
    <>
      {sections.map(section => (
        <TransformReportRecordPathRows
          key={section.rowKeyPrefix}
          {...section}
        />
      ))}
      {record.decodedPreview && (
        <div className="mt-1 font-mono text-cyan-200 truncate" title={record.decodedPreview}>
          解析结果: {record.decodedPreview}
        </div>
      )}
      <div className="mt-1 font-mono text-gray-500 truncate" title={record.originalPreview}>
        原始值: {record.originalPreview}
      </div>
    </>
  );
};
