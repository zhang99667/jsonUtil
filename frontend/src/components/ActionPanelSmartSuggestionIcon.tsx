import React from 'react';

interface ActionPanelSmartSuggestionIconProps {
  className: string;
}

export const ActionPanelSmartSuggestionIcon: React.FC<ActionPanelSmartSuggestionIconProps> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 21l3-1.5L15 21l-.75-4M4 5h16M5 9h14M7 13h10" />
  </svg>
);
