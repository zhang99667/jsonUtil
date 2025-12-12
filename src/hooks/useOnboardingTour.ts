import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export const useOnboardingTour = () => {
    useEffect(() => {
        // 检查用户是否已完成引导
        const hasCompletedOnboarding = localStorage.getItem('json-helper-onboarding-completed');

        if (hasCompletedOnboarding) {
            return;
        }

        // 延迟启动引导，确保 DOM 已完全加载
        const timer = setTimeout(() => {
            const driverObj = driver({
                showProgress: true,
                showButtons: ['next', 'previous', 'close'],
                // 禁用自动滚动，我们手动控制
                smoothScroll: false,
                // 自定义样式类
                popoverClass: 'json-helper-tour-popover',
                // 在显示提示框前手动滚动元素
                onPopoverRender: (popover, { config, state }) => {
                    const element = state.activeElement;
                    if (element) {
                        // 立即滚动到元素位置
                        element.scrollIntoView({ behavior: 'auto', block: 'center' });
                    }
                },
                steps: [
                    {
                        element: 'body',
                        popover: {
                            title: '欢迎使用 JSON 助手 👋',
                            description: '让我们快速了解一下主要功能，帮助您更高效地处理 JSON 数据。',
                            side: 'over',
                            align: 'center'
                        }
                    },
                    {
                        element: '[data-tour="source-editor"]',
                        popover: {
                            title: '源编辑器 📝',
                            description: '在这里输入或粘贴您的 JSON 数据。支持语法高亮、自动补全和错误提示。',
                            side: 'right',
                            align: 'start'
                        }
                    },
                    {
                        element: '[data-tour="toolbar"]',
                        popover: {
                            title: '工具栏 🛠️',
                            description: '提供多种转换模式：格式化、压缩、转义、Unicode 转换等。点击图标即可切换视图。',
                            side: 'right',
                            align: 'start'
                        }
                    },
                    {
                        element: '[data-tour="preview-editor"]',
                        popover: {
                            title: '预览编辑器 👁️',
                            description: '实时显示转换后的结果。您可以解锁编辑模式，直接修改预览内容。',
                            side: 'left',
                            align: 'start'
                        }
                    },
                    {
                        element: '[data-tour="jsonpath-button"]',
                        popover: {
                            title: 'JSONPath 查询 🔍',
                            description: '使用 JSONPath 表达式快速查询和定位 JSON 数据中的特定内容。',
                            side: 'right',
                            align: 'start'
                        }
                    },
                    {
                        element: '[data-tour="file-operations"]',
                        popover: {
                            title: '文件操作 📁',
                            description: '支持打开本地文件、保存文件、创建新标签页等操作。',
                            side: 'right',
                            align: 'start'
                        }
                    },
                    {
                        element: '[data-tour="ai-fix"]',
                        popover: {
                            title: 'AI 智能修复 🤖',
                            description: '遇到格式错误的 JSON？使用 AI 功能自动修复语法问题。需要在设置中配置 API Key。',
                            side: 'right',
                            align: 'start'
                        }
                    },
                    {
                        element: '[data-tour="settings"]',
                        popover: {
                            title: '设置 ⚙️',
                            description: '自定义快捷键、配置 AI 服务等。您可以随时在这里调整应用设置。',
                            side: 'right',
                            align: 'start'
                        }
                    }
                ],
                onDestroyStarted: () => {
                    // 用户完成或跳过引导时，标记为已完成
                    localStorage.setItem('json-helper-onboarding-completed', 'true');
                    driverObj.destroy();
                }
            });

            driverObj.drive();
        }, 1000); // 延迟 1 秒启动

        return () => clearTimeout(timer);
    }, []);

    // 提供手动重启引导的方法
    const restartTour = () => {
        localStorage.removeItem('json-helper-onboarding-completed');
        window.location.reload();
    };

    return { restartTour };
};
