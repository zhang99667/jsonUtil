const backendFileBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const backendFileManagementMaintainabilityBudgets = [
  backendFileBudget('scripts/ci/maintainability-budget-backend-file-management-rules.mjs', 20, '后端文件管理预算表只维护路径边界相关生产代码与测试预算'),
  backendFileBudget('backend/src/main/java/com/jsonhelper/backend/service/FileService.java', 325, '文件服务只负责编排上传、有界预览、下载、删除和数据库一致性'),
  backendFileBudget('backend/src/main/java/com/jsonhelper/backend/service/ManagedUploadPathResolver.java', 145, '受管路径解析器只维护上传根目录、短物理名创建与不跟随链接的打开边界'),
  backendFileBudget('backend/src/main/java/com/jsonhelper/backend/controller/FileController.java', 145, '文件控制器只负责请求参数、响应头和服务调用'),
  backendFileBudget('backend/src/test/java/com/jsonhelper/backend/service/FileServiceTest.java', 530, '文件服务测试只锁定上传、预览、删除一致性和受管路径边界'),
  backendFileBudget('backend/src/test/java/com/jsonhelper/backend/service/FileServiceStorageBoundaryTest.java', 220, '文件存储边界测试只锁定物理名、元数据上限、所有权回滚和预览/下载句柄'),
  backendFileBudget('backend/src/test/java/com/jsonhelper/backend/service/FileServicePreviewReadTest.java', 125, '文件预览读取测试只锁定精确上限、增长流消费预算和配置范围'),
  backendFileBudget('backend/src/test/java/com/jsonhelper/backend/controller/FileControllerTest.java', 155, '文件控制器测试只锁定下载响应与受管路径拒绝行为'),
];
