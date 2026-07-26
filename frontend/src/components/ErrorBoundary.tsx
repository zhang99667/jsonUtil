import { Component, type ErrorInfo, type ReactNode } from 'react';
import { isDynamicImportLoadError } from '../utils/chunkLoadRecovery';
import { getErrorMessage } from '../utils/errors';

/** 捕获子组件树错误并展示回退界面。 */

interface ErrorBoundaryProps {
  children: ReactNode;
  onBeforeReload?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: unknown;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare readonly props: ErrorBoundaryProps;
  declare setState: (state: ErrorBoundaryState) => void;

  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('错误边界捕获到错误:', error);
    console.error('组件栈:', errorInfo.componentStack);
  }

  /** 重置错误状态，重新渲染子组件 */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleReload = (): void => {
    try {
      this.props.onBeforeReload?.();
    } catch (error) {
      console.warn('刷新前保存工作区草稿失败', error);
    }
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const isChunkLoadError = isDynamicImportLoadError(this.state.error);
      const errorMessage = isChunkLoadError ? '' : getErrorMessage(this.state.error, '');

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
            {errorMessage && (
              <pre className="text-red-400 text-xs bg-gray-900 p-3 rounded mb-4 overflow-auto max-h-32 text-left">
                {errorMessage}
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

    return this.props.children;
  }
}

export default ErrorBoundary;
