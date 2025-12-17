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
                // 使用驱动器自带的平滑滚动，避免手动滚动导致的高亮错位
                smoothScroll: true,
                // 自定义样式类
                popoverClass: 'json-helper-tour-popover',
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
                            description: '在此输入或粘贴需要处理的 JSON 数据。支持语法高亮和错误提示。',
                            side: 'right',
                            align: 'center'
                        }
                    },
                    {
                        element: '[data-tour="preview-editor"]',
                        popover: {
                            title: '预览与结果',
                            description: '实时显示处理后的结果。支持只读预览和编辑模式。',
                            side: 'left',
                            align: 'center'
                        }
                    },
                    {
                        element: '[data-tour="toolbar"]',
                        popover: {
                            title: '功能工具栏',
                            description: '集成了格式化、转义、编码转换、AI 修复等核心工具。点击对应按钮即可使用。',
                            side: 'right',
                            align: 'start'
                        }
                    },
                    {
                        element: '[data-tour="statusbar"]',
                        popover: {
                            title: '状态信息栏',
                            description: '显示文件编码、长度、行列信息及当前文件路径。',
                            side: 'top',
                            align: 'center'
                        }
                    },
                    {
                        element: '[data-tour="source-editor"] [data-tour="auto-save"]',
                        popover: {
                            title: '自动保存',
                            description: '打开文件后可启用自动保存功能，确保您的修改不会丢失。',
                            side: 'bottom',
                            align: 'start'
                        }
                    },
                    {
                        element: '[data-tour="source-editor"] [data-tour="editor-tabs"]',
                        popover: {
                            title: '多标签页管理',
                            description: '支持同时打开多个文件进行处理。点击标签切换，点击 + 号新建。',
                            side: 'bottom',
                            align: 'start'
                        }
                    },
                    {
                        element: '[data-tour="preview-editor"] [data-tour="editor-lock"]',
                        popover: {
                            title: '编辑锁定',
                            description: '锁定编辑器以防止意外修改，点击可切换锁定/编辑状态。',
                            side: 'bottom',
                            align: 'end'
                        }
                    },
                    {
                        element: '[data-tour="source-editor"] [data-tour="editor-wrap"]',
                        popover: {
                            title: '自动换行',
                            description: '切换代码的自动换行显示模式，方便查看长文本。',
                            side: 'bottom',
                            align: 'end'
                        }
                    },
                    {
                        element: '[data-tour="statusbar-view"]',
                        popover: {
                            title: '当前视图模式',
                            description: '显示当前的数据转换视图，例如：格式化、压缩、转义等。',
                            side: 'top',
                            align: 'end'
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
