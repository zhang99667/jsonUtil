import { useEffect, useCallback, useRef } from 'react';
import type { DriveStep } from 'driver.js';
import { dispatchChunkLoadRecoveryEvent } from '../utils/chunkLoadRecoveryDispatch';
import { loadDriverTour } from '../utils/driverTourLoader';
import {
    driverTourRuntime,
    type DriverTourRun,
} from '../utils/driverTourRuntime';
import { safeReadStorageItem, safeRemoveStorageItem, safeSetStorageItem } from '../utils/storage';

export enum FeatureId {
    JSONPATH = 'jsonpath',
    AI_FIX = 'ai-fix',
    DEEP_FORMAT = 'deep-format',
    ESCAPE = 'escape',
    UNICODE_CONVERT = 'unicode-convert',
    DISCOVERY_JSONPATH = 'discovery-jsonpath',
    DISCOVERY_FILE_OPS = 'discovery-file-ops',
    DISCOVERY_AI_FIX = 'discovery-ai-fix',
    DISCOVERY_SETTINGS = 'discovery-settings',
}

interface FeatureTourConfig {
    id: FeatureId;
    steps: DriveStep[];
    showOnFirstUse?: boolean;
}

const FEATURE_TOURS: Record<FeatureId, FeatureTourConfig> = {
    [FeatureId.JSONPATH]: {
        id: FeatureId.JSONPATH,
        showOnFirstUse: true,
        steps: [
            {
                element: '[data-tour="jsonpath-panel"]',
                popover: {
                    title: 'JSONPath 查询工具 🔍',
                    description: '使用 JSONPath 表达式快速查询 JSON 数据。支持复杂的路径表达式和过滤条件。',
                    side: 'left',
                    align: 'start'
                }
            },
            {
                element: '[data-tour="jsonpath-input"]',
                popover: {
                    title: '输入查询表达式',
                    description: '在此输入 JSONPath 表达式,例如 $.store.book[0].title 来查询特定数据。',
                    side: 'bottom',
                    align: 'start'
                }
            },
            {
                element: '[data-tour="jsonpath-examples"]',
                popover: {
                    title: '常用示例',
                    description: '点击这些示例可以快速了解 JSONPath 的基本语法。',
                    side: 'bottom',
                    align: 'start'
                }
            },
            {
                element: '[data-tour="jsonpath-history"]',
                popover: {
                    title: '查询历史',
                    description: '您的查询历史会自动保存,方便重复使用。',
                    side: 'bottom',
                    align: 'start'
                }
            }
        ]
    },
    [FeatureId.AI_FIX]: {
        id: FeatureId.AI_FIX,
        showOnFirstUse: true,
        steps: [
            {
                element: 'body',
                popover: {
                    title: '智能修复',
                    description: '优先使用本地规则修复常见 JSON 小错误，本地无法修复时再调用已配置的 AI 服务。',
                    side: 'over',
                    align: 'center'
                }
            }
        ]
    },
    [FeatureId.DEEP_FORMAT]: {
        id: FeatureId.DEEP_FORMAT,
        showOnFirstUse: true,
        steps: [
            {
                element: 'body',
                popover: {
                    title: '嵌套解析功能 🔄',
                    description: '此功能可以递归解析 JSON 字符串中的嵌套 JSON 字符串,将多层转义的数据完全展开。',
                    side: 'over',
                    align: 'center'
                }
            }
        ]
    },
    [FeatureId.ESCAPE]: {
        id: FeatureId.ESCAPE,
        showOnFirstUse: true,
        steps: [
            {
                element: 'body',
                popover: {
                    title: '转义/反转义功能 ✨',
                    description: '转义:将 JSON 转换为可嵌入字符串的格式(添加反斜杠)\n反转义:移除转义字符,还原原始 JSON',
                    side: 'over',
                    align: 'center'
                }
            }
        ]
    },
    [FeatureId.UNICODE_CONVERT]: {
        id: FeatureId.UNICODE_CONVERT,
        showOnFirstUse: true,
        steps: [
            {
                element: 'body',
                popover: {
                    title: 'Unicode 转换 🌏',
                    description: 'Unicode 转中文:将 \\uXXXX 格式转换为可读的中文字符\n中文转 Unicode:将中文字符转换为 \\uXXXX 格式',
                    side: 'over',
                    align: 'center'
                }
            }
        ]
    },
    [FeatureId.DISCOVERY_JSONPATH]: {
        id: FeatureId.DISCOVERY_JSONPATH,
        showOnFirstUse: true,
        steps: [
            {
                element: '[data-tour="jsonpath-button"]',
                popover: {
                    title: 'JSONPath 查询 🔍',
                    description: '使用 JSONPath 表达式快速查询和定位 JSON 数据中的特定内容。',
                    side: 'right',
                    align: 'start'
                }
            }
        ]
    },
    [FeatureId.DISCOVERY_FILE_OPS]: {
        id: FeatureId.DISCOVERY_FILE_OPS,
        showOnFirstUse: true,
        steps: [
            {
                element: '[data-tour="file-operations"]',
                popover: {
                    title: '文件操作 📁',
                    description: '支持打开本地文件、保存文件、创建新标签页等操作。',
                    side: 'right',
                    align: 'start'
                }
            }
        ]
    },
    [FeatureId.DISCOVERY_AI_FIX]: {
        id: FeatureId.DISCOVERY_AI_FIX,
        showOnFirstUse: true,
        steps: [
            {
                element: '[data-tour="ai-fix"]',
                popover: {
                    title: '智能修复',
                    description: '遇到格式错误的 JSON？先尝试本地规则修复，必要时再使用 AI 服务处理更复杂的问题。',
                    side: 'right',
                    align: 'start'
                }
            }
        ]
    },
    [FeatureId.DISCOVERY_SETTINGS]: {
        id: FeatureId.DISCOVERY_SETTINGS,
        showOnFirstUse: true,
        steps: [
            {
                element: '[data-tour="settings"]',
                popover: {
                    title: '设置 ⚙️',
                    description: '自定义快捷键、配置 AI 服务等。您可以随时在这里调整应用设置。',
                    side: 'right',
                    align: 'start'
                }
            }
        ]
    }
};

const STORAGE_KEY_PREFIX = 'json-helper-feature-tour-';
const getTourStorageKey = (featureId: FeatureId) => `${STORAGE_KEY_PREFIX}${featureId}`;

const reportFeatureTourStartError = (message: string, error: unknown) => {
    if (dispatchChunkLoadRecoveryEvent(error)) return;
    console.warn(message, error);
};

export const useFeatureTour = () => {
    const activeRunRef = useRef<DriverTourRun | null>(null);

    const hasCompletedTour = useCallback((featureId: FeatureId): boolean => {
        return safeReadStorageItem(getTourStorageKey(featureId)).value === 'completed';
    }, []);

    const markTourCompleted = useCallback((featureId: FeatureId) => {
        safeSetStorageItem(getTourStorageKey(featureId), 'completed');
    }, []);

    const resetTour = useCallback((featureId: FeatureId) => {
        safeRemoveStorageItem(getTourStorageKey(featureId));
    }, []);

    const resetAllTours = useCallback(() => {
        Object.values(FeatureId).forEach(featureId => {
            resetTour(featureId);
        });
    }, [resetTour]);

    const startFeatureTour = useCallback(async (featureId: FeatureId, force: boolean = false) => {
        const config = FEATURE_TOURS[featureId];
        if (!config) {
            console.warn(`未找到功能引导配置: ${featureId}`);
            return;
        }

        if (!force) {
            const completion = safeReadStorageItem(getTourStorageKey(featureId));
            if (!completion.ok || completion.value === 'completed') return;
        }

        const run = driverTourRuntime.begin({
            onDestroyError: error => console.warn('清理功能引导实例失败:', error),
            onDriveError: error => reportFeatureTourStartError('启动功能引导失败:', error),
            onRefreshError: error => console.warn('刷新功能引导位置失败:', error),
        });
        activeRunRef.current = run;

        let createDriver: Awaited<ReturnType<typeof loadDriverTour>>;
        try {
            createDriver = await loadDriverTour();
        } catch (error) {
            if (!run.isCurrent()) return;
            run.cancel();
            reportFeatureTourStartError('加载功能引导组件失败:', error);
            return;
        }

        if (!run.isCurrent()) return;

        try {
            const newDriver = createDriver({
                showProgress: config.steps.length > 1,
                showButtons: ['next', 'previous', 'close'],
                smoothScroll: false,
                animate: false,
                stagePadding: 3,
                stageRadius: 7,
                popoverClass: 'json-helper-feature-tour-popover',
                steps: config.steps,
                onDestroyStarted: () => {
                    run.complete(() => markTourCompleted(featureId));
                }
            });
            if (!run.adopt(newDriver)) return;
            run.driveAfter(500);
        } catch (error) {
            if (!run.isCurrent()) return;
            run.cancel();
            reportFeatureTourStartError('启动功能引导失败:', error);
        }
    }, [markTourCompleted]);

    const triggerFeatureFirstUse = useCallback((featureId: FeatureId) => {
        const config = FEATURE_TOURS[featureId];
        if (config?.showOnFirstUse) {
            void startFeatureTour(featureId);
        }
    }, [startFeatureTour]);

    useEffect(() => {
        return () => {
            activeRunRef.current?.cancel();
            activeRunRef.current = null;
        };
    }, []);

    const refreshTour = useCallback(() => {
        driverTourRuntime.refresh();
    }, []);

    return {
        startFeatureTour,
        triggerFeatureFirstUse,
        hasCompletedTour,
        resetTour,
        resetAllTours,
        refreshTour
    };
};
