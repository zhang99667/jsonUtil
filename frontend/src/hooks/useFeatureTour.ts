import { useState, useEffect, useCallback } from 'react';
import { driver, DriveStep, Driver } from 'driver.js';
import 'driver.js/dist/driver.css';

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
                    title: 'AI 智能修复 🤖',
                    description: '使用 AI 自动修复格式错误的 JSON。首次使用需要在设置中配置 API Key。',
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
                    title: 'AI 智能修复 🤖',
                    description: '遇到格式错误的 JSON？使用 AI 功能自动修复语法问题。需要在设置中配置 API Key。',
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

export const useFeatureTour = () => {
    const [driverInstance, setDriverInstance] = useState<Driver | null>(null);

    // 检查功能是否已完成引导
    const hasCompletedTour = useCallback((featureId: FeatureId): boolean => {
        const key = `${STORAGE_KEY_PREFIX}${featureId}`;
        return localStorage.getItem(key) === 'completed';
    }, []);

    // 标记功能引导为已完成
    const markTourCompleted = useCallback((featureId: FeatureId) => {
        const key = `${STORAGE_KEY_PREFIX}${featureId}`;
        localStorage.setItem(key, 'completed');
    }, []);

    // 重置功能引导状态
    const resetTour = useCallback((featureId: FeatureId) => {
        const key = `${STORAGE_KEY_PREFIX}${featureId}`;
        localStorage.removeItem(key);
    }, []);

    // 重置所有功能引导
    const resetAllTours = useCallback(() => {
        Object.values(FeatureId).forEach(featureId => {
            resetTour(featureId);
        });
    }, [resetTour]);

    // 启动功能引导
    const startFeatureTour = useCallback((featureId: FeatureId, force: boolean = false) => {
        const config = FEATURE_TOURS[featureId];
        if (!config) {
            console.warn(`Feature tour not found for: ${featureId}`);
            return;
        }

        // 如果不是强制显示,且已完成引导,则跳过
        if (!force && hasCompletedTour(featureId)) {
            return;
        }

        // 销毁之前的实例
        if (driverInstance) {
            driverInstance.destroy();
        }

        // 创建新的 driver 实例
        const newDriver = driver({
            showProgress: config.steps.length > 1,
            showButtons: ['next', 'previous', 'close'],
            smoothScroll: false, // 禁用平滑滚动以避免定位问题
            animate: false,      // 禁用动画以提高稳定性
            stagePadding: 5,     // 增加高亮区域内边距
            popoverClass: 'json-helper-feature-tour-popover',
            steps: config.steps,
            onDestroyStarted: () => {
                // 用户完成或跳过引导时,标记为已完成
                markTourCompleted(featureId);
                newDriver.destroy();
                setDriverInstance(null);
            }
        });

        setDriverInstance(newDriver);

        // 延迟启动,确保 DOM 已渲染且布局稳定
        setTimeout(() => {
            newDriver.drive();
        }, 500);
    }, [driverInstance, hasCompletedTour, markTourCompleted]);

    // 触发功能首次使用检查
    const triggerFeatureFirstUse = useCallback((featureId: FeatureId) => {
        const config = FEATURE_TOURS[featureId];
        if (config?.showOnFirstUse && !hasCompletedTour(featureId)) {
            startFeatureTour(featureId);
        }
    }, [hasCompletedTour, startFeatureTour]);

    // 清理
    useEffect(() => {
        return () => {
            if (driverInstance) {
                driverInstance.destroy();
            }
        };
    }, [driverInstance]);

    // 刷新引导位置 (用于元素位置变化时)
    const refreshTour = useCallback(() => {
        if (driverInstance) {
            // driver.js v1 使用 refresh() 重新计算位置
            // @ts-ignore - 避免类型定义可能缺失的问题
            if (typeof driverInstance.refresh === 'function') {
                // @ts-ignore
                driverInstance.refresh();
            } else {
                // 尝试重新驱动当前步骤
                // @ts-ignore
                driverInstance.drive();
            }
        }
    }, [driverInstance]);

    return {
        startFeatureTour,
        triggerFeatureFirstUse,
        hasCompletedTour,
        resetTour,
        resetAllTours,
        refreshTour
    };
};
