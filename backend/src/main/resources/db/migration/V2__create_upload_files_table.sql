-- =====================================================
-- V2: 创建上传文件表
-- 用于存储用户上传的文件元数据
-- =====================================================

CREATE TABLE IF NOT EXISTS upload_files (
    id             BIGSERIAL      PRIMARY KEY,
    file_name      VARCHAR(500)   NOT NULL,
    file_size      BIGINT         NOT NULL,
    file_type      VARCHAR(255),
    storage_path   VARCHAR(1000)  NOT NULL,
    uploader       VARCHAR(255)   NOT NULL,
    created_at     TIMESTAMP      NOT NULL DEFAULT NOW()
);
