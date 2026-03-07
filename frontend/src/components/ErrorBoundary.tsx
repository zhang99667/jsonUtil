import React from 'react';

/**
 * 错误边界组件
 * 捕获子组件树中的 JS 错误，展示友好的错误回退界面
 */

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // 输出错误信息到控制台
    console.error('ErrorBoundary 捕获到错误:', error);
    console.error('组件栈:', errorInfo.componentStack);
  }

  /** 重置错误状态，重新渲染子组件 */
  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
          <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl max-w-md mx-4">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-white mb-2">出了点问题</h1>
            <p className="text-gray-400 mb-4 text-sm">
              应用遇到了一个意外错误，请尝试重新加载。
            </p>
            {this.state.error && (
              <pre className="text-red-400 text-xs bg-gray-900 p-3 rounded mb-4 overflow-auto max-h-32 text-left">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              重试
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
