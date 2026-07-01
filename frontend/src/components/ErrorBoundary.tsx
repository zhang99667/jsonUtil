import { Component, type ErrorInfo, type ReactNode } from 'react';
import { isDynamicImportLoadError } from '../utils/chunkLoadRecovery';

/**
 * 错误边界组件
 * 捕获子组件树中的 JS 错误，展示友好的错误回退界面
 */

interface ErrorBoundaryProps {
  children: ReactNode;
  onBeforeReload?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

type ErrorBoundaryInstance = ErrorBoundary & {
  props: ErrorBoundaryProps;
  setState: (state: ErrorBoundaryState) => void;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  private getInstance(): ErrorBoundaryInstance {
    return this as unknown as ErrorBoundaryInstance;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 输出错误信息到控制台
    console.error('ErrorBoundary 捕获到错误:', error);
    console.error('组件栈:', errorInfo.componentStack);
  }

  /** 重置错误状态，重新渲染子组件 */
  handleReset = (): void => {
    this.getInstance().setState({
      hasError: false,
      error: null,
    });
  };

  handleReload = (): void => {
    try {
      this.getInstance().props.onBeforeReload?.();
    } catch (error) {
      console.warn('刷新前保存工作区草稿失败', error);
    }
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const isChunkLoadError = isDynamicImportLoadError(this.state.error);
      const shouldShowErrorMessage = Boolean(this.state.error && !isChunkLoadError);

      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
          <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl max-w-md mx-4">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-white mb-2">{isChunkLoadError ? '页面资源已更新' : '出了点问题'}</h1>
            <p className="text-gray-400 mb-4 text-sm">
              {isChunkLoadError
                ? '当前打开的旧页面无法加载新版资源，刷新后即可恢复。'
                : '应用遇到了一个意外错误，请尝试重新加载。'}
            </p>
            {shouldShowErrorMessage && (
              <pre className="text-red-400 text-xs bg-gray-900 p-3 rounded mb-4 overflow-auto max-h-32 text-left">
                {this.state.error?.message}
              </pre>
            )}
            <button
              onClick={isChunkLoadError ? this.handleReload : this.handleReset}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {isChunkLoadError ? '刷新页面' : '重试'}
            </button>
          </div>
        </div>
      );
    }

    return this.getInstance().props.children;
  }
}

export default ErrorBoundary;
