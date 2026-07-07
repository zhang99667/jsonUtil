import React from 'react';

interface TemplateFillStatusAlertsProps {
  hasTemplateContent: boolean;
  templateError?: string;
  targetError?: string;
}

const TemplateFillWarningIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const TemplateFillInfoIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20.5a8.5 8.5 0 100-17 8.5 8.5 0 000 17z" />
  </svg>
);

export const TemplateFillStatusAlerts: React.FC<TemplateFillStatusAlertsProps> = ({
  hasTemplateContent,
  templateError,
  targetError,
}) => (
  <>
    {hasTemplateContent && templateError && (
      <div
        data-tour="template-fill-validation-error"
        className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded px-2.5 py-1.5 flex items-center gap-1.5"
      >
        <TemplateFillWarningIcon />
        {templateError}
      </div>
    )}

    {targetError && (
      <div
        data-tour="template-fill-target-error"
        className="text-xs text-amber-300 bg-amber-900/20 border border-amber-700/30 rounded px-2.5 py-1.5 flex items-center gap-1.5"
      >
        <TemplateFillInfoIcon />
        {targetError}
      </div>
    )}
  </>
);
