import React from 'react';
import type { SchemeCommandSummaryInfo } from '../utils/schemeMetadata';
import { SchemeViewerCommandInsightBadges } from './SchemeViewerCommandInsightBadges';
import { SchemeViewerCommandParamBadges } from './SchemeViewerCommandParamBadges';
import { SchemeViewerCommandSchemaBadges } from './SchemeViewerCommandSchemaBadges';

interface SchemeViewerCommandSummaryPanelProps {
  commandSummaryInfo: SchemeCommandSummaryInfo | null;
}

export const SchemeViewerCommandSummaryPanel: React.FC<SchemeViewerCommandSummaryPanelProps> = ({
  commandSummaryInfo,
}) => {
  if (!commandSummaryInfo) return null;

  return (
    <div data-tour="scheme-command-summary" className="flex items-start gap-2 text-xs">
      <span className="shrink-0 text-cyan-300 bg-cyan-900/30 border border-cyan-700/50 px-2 py-0.5 rounded">
        CMD 结构
      </span>
      <div className="flex flex-wrap gap-1 min-w-0">
        <SchemeViewerCommandSchemaBadges
          commandSchema={commandSummaryInfo.commandSchema}
          commandSchemaCount={commandSummaryInfo.commandSchemaCount}
          topCommandSchemas={commandSummaryInfo.topCommandSchemas}
        />
        <SchemeViewerCommandParamBadges
          paramCount={commandSummaryInfo.paramCount}
          paramKeys={commandSummaryInfo.paramKeys}
        />
        <SchemeViewerCommandInsightBadges
          commandFields={commandSummaryInfo.commandFields}
          extFields={commandSummaryInfo.extFields}
          base64SuffixFields={commandSummaryInfo.base64SuffixFields}
        />
      </div>
    </div>
  );
};
