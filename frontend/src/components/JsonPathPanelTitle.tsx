import React from 'react';

const JSONPATH_SYNTAX_DOC_URL = 'https://docs.apifox.com/doc-5725287';

export const JsonPathPanelTitle: React.FC = () => (
    <div className="flex items-center gap-2">
        <span>JSONPath 查询</span>
        <button
            type="button"
            onClick={() => window.open(JSONPATH_SYNTAX_DOC_URL, '_blank', 'noopener,noreferrer')}
            className="rounded text-gray-400 transition-colors hover:text-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            title="学习 JSONPath 语法"
            aria-label="学习 JSONPath 语法"
        >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM8.94 6.94a.75.75 0 1 1-1.061-1.061 3 3 0 1 1 2.871 5.026v.345a.75.75 0 0 1-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 1 0 8.94 6.94ZM10 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
        </button>
    </div>
);
