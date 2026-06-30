import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { installChunkLoadRecoveryListeners } from '../utils/chunkLoadRecoveryEvents';
import '../components/AppReleaseToast.css';

const CHUNK_LOAD_TOAST_ID = 'json-helper-chunk-load-recovery';

interface UseAppChunkLoadRecoveryOptions {
  onBeforeReload?: () => void;
}

export const useAppChunkLoadRecovery = (options: UseAppChunkLoadRecoveryOptions = {}) => {
  const { onBeforeReload } = options;

  useEffect(() => {
    if (!import.meta.env.PROD) return undefined;

    const reloadAfterRecoverySnapshot = () => {
      try {
        onBeforeReload?.();
      } catch (error) {
        console.warn('刷新前保存工作区草稿失败', error);
      }
      window.location.reload();
    };

    const showRefreshToast = () => {
      toast.custom(() => (
        <div className="app-release-toast app-release-toast--chunk">
          <div className="app-release-toast__body">
            <div className="app-release-toast__title">页面资源已更新</div>
            <div className="app-release-toast__description">当前打开的旧页面无法加载新版资源，刷新后即可恢复。</div>
          </div>
          <button
            type="button"
            className="app-release-toast__button app-release-toast__button--chunk"
            onClick={reloadAfterRecoverySnapshot}
          >
            刷新页面
          </button>
        </div>
      ), {
        id: CHUNK_LOAD_TOAST_ID,
        duration: Infinity,
        position: 'top-center',
      });
    };

    return installChunkLoadRecoveryListeners(window, showRefreshToast);
  }, [onBeforeReload]);
};
