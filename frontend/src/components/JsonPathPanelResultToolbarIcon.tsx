import React, { type ReactNode } from 'react';

export type JsonPathPanelResultToolbarIconName = 'copyValues' | 'copyPathValues' | 'previous' | 'next';

interface JsonPathPanelResultToolbarIconProps {
    icon: JsonPathPanelResultToolbarIconName;
}

const toolbarActionIconPaths: Record<JsonPathPanelResultToolbarIconName, ReactNode> = {
    copyValues: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    ),
    copyPathValues: (
        <>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M8 4h8l4 4v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v4h4" />
        </>
    ),
    previous: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    ),
    next: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    ),
};

export const JsonPathPanelResultToolbarIcon: React.FC<JsonPathPanelResultToolbarIconProps> = ({ icon }) => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {toolbarActionIconPaths[icon]}
    </svg>
);
