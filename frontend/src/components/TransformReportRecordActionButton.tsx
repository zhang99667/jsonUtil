import React from 'react';

interface TransformReportRecordActionButtonProps {
  children: React.ReactNode;
  className: string;
  'data-tour': string;
  title?: string;
  onClick: () => void;
}

export const TransformReportRecordActionButton: React.FC<TransformReportRecordActionButtonProps> = ({
  children,
  className,
  title,
  onClick,
  'data-tour': dataTour,
}) => (
  <button type="button" data-tour={dataTour} onClick={onClick} className={className} title={title}>
    {children}
  </button>
);
