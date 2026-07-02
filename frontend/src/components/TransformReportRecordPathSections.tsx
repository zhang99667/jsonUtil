import React from 'react';
import type { TransformReportRecord } from '../utils/transformSummary';
import { buildTransformReportRecordPathSections } from './transformReportRecordPathSectionConfigs';
import { TransformReportRecordPathRows } from './TransformReportRecordPathRows';
import type { TransformReportRecordPathActions } from './TransformReportRecordSectionContracts';

interface TransformReportRecordPathSectionsProps {
  record: TransformReportRecord;
  actions: TransformReportRecordPathActions;
}

export const TransformReportRecordPathSections: React.FC<TransformReportRecordPathSectionsProps> = ({
  record,
  actions,
}) => {
  const sections = buildTransformReportRecordPathSections(record, actions);

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
