import React, { type ReactNode } from 'react';
import type { TransformReportFooterAction, TransformReportFooterActionId } from '../utils/transformReportFooterActions';
import { DraggablePanel, PanelIcons } from './DraggablePanel';
import { TransformReportPanelFooter } from './TransformReportPanelFooter';

interface TransformReportPanelFrameProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string;
  actions: TransformReportFooterAction[];
  actionHandlers: Record<TransformReportFooterActionId, () => void>;
  children: ReactNode;
}

export const TransformReportPanelFrame: React.FC<TransformReportPanelFrameProps> = ({
  isOpen,
  onClose,
  summary,
  actions,
  actionHandlers,
  children,
}) => (
  <DraggablePanel
    isOpen={isOpen}
    onClose={onClose}
    title="深度解析报告"
    icon={PanelIcons.Code}
    storageKey="transform-report-panel"
    defaultPosition={{ x: 220, y: 120 }}
    defaultSize={{ width: 680, height: 520 }}
    minSize={{ width: 480, height: 320 }}
    footer={(
      <TransformReportPanelFooter
        summary={summary}
        actions={actions}
        actionHandlers={actionHandlers}
      />
    )}
    dataTour="transform-report-panel"
  >
    {children}
  </DraggablePanel>
);
