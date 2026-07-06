import React from 'react';
import type { JsonPathScenarioExample } from '../utils/jsonPathExamples';
import { JSONPATH_EXAMPLES, RESPONSE_JSONPATH_PRESETS } from '../utils/jsonPathPanelPresets';

interface JsonPathPanelSuggestionsProps {
    scenarioExamples: JsonPathScenarioExample[];
    onSelectQuery: (query: string) => void;
}

export const JsonPathPanelSuggestions: React.FC<JsonPathPanelSuggestionsProps> = ({
    scenarioExamples,
    onSelectQuery,
}) => (
    <>
        <div className="mb-3" data-tour="jsonpath-examples">
            <div className="text-xs text-gray-500 mb-2">常用示例:</div>
            <div className="flex flex-wrap gap-2">
                {JSONPATH_EXAMPLES.map((example) => (
                    <button
                        key={example.query}
                        onClick={() => onSelectQuery(example.query)}
                        className="text-xs px-2 py-1 bg-editor-border text-gray-300 rounded hover:bg-editor-active transition-colors"
                        title={`${example.query}\n点击填入并查询`}
                        aria-label={`填入并查询示例：${example.label}（${example.query}）`}
                    >
                        {example.label}
                    </button>
                ))}
            </div>
        </div>

        {scenarioExamples.length > 0 && (
            <div className="mb-3" data-tour="jsonpath-scenario-examples">
                <div className="text-xs text-gray-500 mb-2">场景示例:</div>
                <div className="flex flex-wrap gap-2">
                    {scenarioExamples.map((example) => (
                        <button
                            key={example.id}
                            onClick={() => onSelectQuery(example.query)}
                            className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100 transition-colors hover:border-emerald-400/50 hover:bg-emerald-500/20"
                            title={`${example.description}\n${example.query}\n点击填入并查询`}
                            aria-label={`填入并查询场景示例：${example.label}（${example.query}）`}
                        >
                            {example.label}
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div className="mb-3" data-tour="jsonpath-response-presets">
            <div className="text-xs text-gray-500 mb-2">Response 常用:</div>
            <div className="flex flex-wrap gap-2">
                {RESPONSE_JSONPATH_PRESETS.map((preset) => (
                    <button
                        key={preset.query}
                        data-tour="jsonpath-response-preset"
                        onClick={() => onSelectQuery(preset.query)}
                        className="rounded border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 font-mono text-[11px] text-cyan-100 transition-colors hover:border-cyan-400/50 hover:bg-cyan-500/20"
                        title={`${preset.query}\n点击填入并查询`}
                        aria-label={`填入并查询 Response 常用：${preset.label}（${preset.query}）`}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>
        </div>
    </>
);
