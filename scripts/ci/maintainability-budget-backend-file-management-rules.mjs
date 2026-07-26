const backendFileBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const backendFileManagementMaintainabilityBudgets = [
  backendFileBudget('scripts/ci/maintainability-budget-backend-file-management-rules.mjs', 20, '后端文件管理预算表只维护路径边界相关生产代码与测试预算'),
  backendFileBudget('backend/src/main/java/com/jsonhelper/backend/config/FileProperties.java', 80, '文件配置只维护标准绑定、启动期校验和扩展名归一化'),
  backendFileBudget('backend/src/main/java/com/jsonhelper/backend/service/FileService.java', 325, '文件服务只负责编排上传、有界预览、下载、删除和数据库一致性'),
  backendFileBudget('backend/src/main/java/com/jsonhelper/backend/service/ManagedUploadPathResolver.java', 145, '受管路径解析器只维护上传根目录、短物理名创建与不跟随链接的打开边界'),
  backendFileBudget('backend/src/main/java/com/jsonhelper/backend/controller/FileController.java', 95, '文件控制器只负责请求参数、响应头和类型化服务响应编排'),
  backendFileBudget('backend/src/main/java/com/jsonhelper/backend/dto/response/FileItemDTO.java', 35, '文件条目响应只维护实体字段到稳定接口字段的不可变映射'),
  backendFileBudget('backend/src/main/java/com/jsonhelper/backend/dto/response/FileListDTO.java', 15, '文件列表响应只维护不可变条目快照和总数'),
  backendFileBudget('backend/src/test/java/com/jsonhelper/backend/service/FileServiceTest.java', 530, '文件服务测试只锁定上传、预览、删除一致性和受管路径边界'),
  backendFileBudget('backend/src/test/java/com/jsonhelper/backend/service/FileServiceStorageBoundaryTest.java', 220, '文件存储边界测试只锁定物理名、元数据上限、所有权回滚和预览/下载句柄'),
  backendFileBudget('backend/src/test/java/com/jsonhelper/backend/service/FileServiceUploadStreamTest.java', 125, '上传流测试只锁定真实字节上限、短暂无进展读取和失败回滚'),
  backendFileBudget('backend/src/test/java/com/jsonhelper/backend/service/FileServicePreviewReadTest.java', 125, '文件预览读取测试只锁定精确上限、增长流消费预算和配置范围'),
  backendFileBudget('backend/src/test/java/com/jsonhelper/backend/controller/FileControllerTest.java', 155, '文件控制器测试只锁定下载响应与受管路径拒绝行为'),
  backendFileBudget('backend/src/test/java/com/jsonhelper/backend/controller/FileControllerResponseTest.java', 145, '文件响应测试只锁定分页换算、字段映射、不可变快照和上传身份'),
];
