import { useEffect, useCallback, useRef } from 'react';
import type { DriveStep, Driver } from 'driver.js';
import { dispatchChunkLoadRecoveryEvent } from '../utils/chunkLoadRecoveryDispatch';
import { loadDriverTour } from '../utils/driverTourLoader';
import { safeReadStorageItem, safeRemoveStorageItem, safeSetStorageItem } from '../utils/storage';

// 定义所有支持引导的功能
export enum FeatureId {
    JSONPATH = 'jsonpath',
    AI_FIX = 'ai-fix',
    DEEP_FORMAT = 'deep-format',
    ESCAPE = 'escape',
    UNICODE_CONVERT = 'unicode-convert',
    // 滚动发现式引导
    DISCOVERY_JSONPATH = 'discovery-jsonpath',
    DISCOVERY_FILE_OPS = 'discovery-file-ops',
    DISCOVERY_AI_FIX = 'discovery-ai-fix',
    DISCOVERY_SETTINGS = 'discovery-settings',
}

// 功能引导配置
interface FeatureTourConfig {
    id: FeatureId;
    steps: DriveStep[];
    showOnFirstUse?: boolean; // 是否在首次使用时自动显示
}

// 功能引导配置映射
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
    // 滚动发现式引导
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

export const useFeatureTour = () => {
    const driverInstanceRef = useRef<Driver | null>(null);
    const isMountedRef = useRef(true);
    const startRequestIdRef = useRef(0);

    // 检查功能是否已完成引导
    const hasCompletedTour = useCallback((featureId: FeatureId): boolean => {
        return safeReadStorageItem(getTourStorageKey(featureId)).value === 'completed';
    }, []);

    // 标记功能引导为已完成
    const markTourCompleted = useCallback((featureId: FeatureId) => {
        safeSetStorageItem(getTourStorageKey(featureId), 'completed');
    }, []);

    // 重置功能引导状态
    const resetTour = useCallback((featureId: FeatureId) => {
        safeRemoveStorageItem(getTourStorageKey(featureId));
    }, []);

    // 重置所有功能引导
    const resetAllTours = useCallback(() => {
        Object.values(FeatureId).forEach(featureId => {
            resetTour(featureId);
        });
    }, [resetTour]);

    // 启动功能引导
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

        const requestId = ++startRequestIdRef.current;

        // 销毁之前的实例
        if (driverInstanceRef.current) {
            driverInstanceRef.current.destroy();
            driverInstanceRef.current = null;
        }

        let createDriver: Awaited<ReturnType<typeof loadDriverTour>>;
        try {
            createDriver = await loadDriverTour();
        } catch (error) {
            if (!isMountedRef.current || startRequestIdRef.current !== requestId) return;
            if (dispatchChunkLoadRecoveryEvent(error)) return;

            console.warn('加载功能引导组件失败:', error);
            return;
        }

        if (!isMountedRef.current || startRequestIdRef.current !== requestId) return;

        // 创建新的引导器实例
        const newDriver = createDriver({
            showProgress: config.steps.length > 1,
            showButtons: ['next', 'previous', 'close'],
            smoothScroll: false, // 禁用平滑滚动以避免定位问题
            animate: false,      // 禁用动画以提高稳定性
            stagePadding: 3,     // 小按钮目标只保留轻量留白，避免像被套上选中框
            stageRadius: 7,
            popoverClass: 'json-helper-feature-tour-popover',
            steps: config.steps,
            onDestroyStarted: () => {
                // 用户完成或跳过引导时，标记为已完成
                markTourCompleted(featureId);
                newDriver.destroy();
                if (driverInstanceRef.current === newDriver) {
                    driverInstanceRef.current = null;
                }
            }
        });

        driverInstanceRef.current = newDriver;

        // 延迟启动，确保页面元素已渲染且布局稳定
        setTimeout(() => {
            if (
                !isMountedRef.current
                || startRequestIdRef.current !== requestId
                || driverInstanceRef.current !== newDriver
            ) return;
            newDriver.drive();
        }, 500);
    }, [markTourCompleted]);

    // 触发功能首次使用检查
    const triggerFeatureFirstUse = useCallback((featureId: FeatureId) => {
        const config = FEATURE_TOURS[featureId];
        if (config?.showOnFirstUse) {
            void startFeatureTour(featureId);
        }
    }, [startFeatureTour]);

    // 清理
    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
            startRequestIdRef.current += 1;
            if (driverInstanceRef.current) {
                driverInstanceRef.current.destroy();
                driverInstanceRef.current = null;
            }
        };
    }, []);

    // 刷新引导位置，用于元素位置变化时
    const refreshTour = useCallback(() => {
        driverInstanceRef.current?.refresh();
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
