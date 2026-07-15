const appStructureNavHelperBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appStructureNavHelperMaintainabilityBudgets = [
  appStructureNavHelperBudget('frontend/src/hooks/useJsonTreeModel.ts', 150, '结构导航模型 hook 只维护线程请求身份、单次结算、状态写入和幂等回收'),
  appStructureNavHelperBudget('frontend/src/utils/jsonTreeModel.ts', 480, '结构导航综合模型只维护搜索、复制、表格预览和图谱投影，不再承载节点遍历生命周期'),
  appStructureNavHelperBudget('frontend/src/utils/jsonTreeTraversal.ts', 280, '结构导航遍历只维护解析、惰性深度优先游标、节点预算和深度预算'),
  appStructureNavHelperBudget('frontend/src/utils/jsonTreeWorker.ts', 40, '结构导航线程协议只定义请求、响应、可注入接口和默认工厂'),
  appStructureNavHelperBudget('frontend/src/workers/jsonTree.worker.ts', 35, '结构导航线程入口只负责构建模型并回传成功或错误响应'),
  appStructureNavHelperBudget('frontend/src/utils/jsonTreePresentation.ts', 80, '结构导航展示 helper 只维护类型标签、展示样式、Pointer 文案和数组下标识别'),
];
