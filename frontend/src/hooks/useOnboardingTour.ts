import { useEffect } from 'react';
import { dispatchChunkLoadRecoveryEvent } from '../utils/chunkLoadRecoveryDispatch';
import { loadDriverTour } from '../utils/driverTourLoader';
import {
    driverTourRuntime,
    type DriverTourRun,
} from '../utils/driverTourRuntime';
import {
    safeReadStorageItem,
    safeSetStorageItem,
} from '../utils/storage';

export const useOnboardingTour = () => {
    useEffect(() => {
        const onboardingStatus = safeReadStorageItem('json-helper-onboarding-completed');

        // 本地存储被浏览器阻止时跳过自动引导，避免每次启动都弹出且无法记住关闭状态。
        if (!onboardingStatus.ok || onboardingStatus.value) {
            return;
        }

        let disposed = false;
        const run: DriverTourRun = driverTourRuntime.begin({
            onDestroyError: error => {
                if (!disposed) console.warn('清理新手引导实例失败:', error);
            },
            onDriveError: error => {
                if (dispatchChunkLoadRecoveryEvent(error)) return;
                console.warn('启动新手引导失败:', error);
            },
        });

        // 延迟到主界面完成首轮渲染后再筛选可见目标。
        const timer = setTimeout(async () => {
            if (!run.isCurrent()) return;
            try {
                const [createDriver, { ONBOARDING_TOUR_STEPS }] = await Promise.all([
                    loadDriverTour(),
                    import('../utils/onboardingTourSteps'),
                ]);
                if (!run.isCurrent()) return;

                // 引导组件会把缺失目标降级为页面中央虚拟元素，启动前过滤可避免误导用户。
                const availableSteps = ONBOARDING_TOUR_STEPS.filter(step => (
                    step.element === 'body'
                    || typeof step.element !== 'string'
                    || document.querySelector(step.element) !== null
                ));

                const driver = createDriver({
                    showProgress: true,
                    showButtons: ['next', 'previous', 'close'],
                    smoothScroll: true,
                    stagePadding: 4,
                    stageRadius: 7,
                    popoverClass: 'json-helper-tour-popover',
                    steps: availableSteps,
                    onDestroyStarted: () => {
                        // 只有用户完成或跳过引导时才记录完成状态，组件卸载不触发该回调。
                        run.complete(() => {
                            safeSetStorageItem('json-helper-onboarding-completed', 'true');
                        });
                    }
                });
                if (!run.adopt(driver)) return;
                run.drive();
            } catch (error) {
                if (!run.isCurrent()) return;
                run.cancel();
                if (dispatchChunkLoadRecoveryEvent(error)) return;
                console.warn('启动新手引导失败:', error);
            }
        }, 1000);

        return () => {
            disposed = true;
            clearTimeout(timer);
            run.cancel();
        };
    }, []);
};
