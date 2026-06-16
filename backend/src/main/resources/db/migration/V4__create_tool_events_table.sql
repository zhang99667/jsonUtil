-- =====================================================
-- V4: 创建匿名工具事件表
-- 用于统计工具使用、失败率和输入/耗时分桶，不保存原始 JSON 内容
-- =====================================================

CREATE TABLE IF NOT EXISTS tool_events (
    id                  BIGSERIAL    PRIMARY KEY,
    event_name          VARCHAR(64)  NOT NULL,
    category            VARCHAR(48)  NOT NULL,
    status              VARCHAR(24)  NOT NULL,
    input_size_bucket   VARCHAR(24)  NOT NULL,
    duration_bucket     VARCHAR(24)  NOT NULL,
    source              VARCHAR(24)  NOT NULL,
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tool_events_created_at
    ON tool_events (created_at);

CREATE INDEX IF NOT EXISTS idx_tool_events_event_name
    ON tool_events (event_name);

CREATE INDEX IF NOT EXISTS idx_tool_events_status
    ON tool_events (status);
