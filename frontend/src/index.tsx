const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const mountApplication = async () => {
  const [{ default: React }, ReactDOM, { default: App }] = await Promise.all([
    import('react'),
    import('react-dom/client'),
    import('./App'),
    import('./utils/monacoLoader'),
  ]);
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    React.createElement(
      React.StrictMode,
      null,
      React.createElement(App),
    ),
  );
};

// 先让浏览器绘制 HTML 中的可读产品说明，再启动完整工作台。
// 工具能力不延迟到空闲期，首帧之后立即加载，避免牺牲首次操作响应。
requestAnimationFrame(() => {
  void mountApplication();
});
