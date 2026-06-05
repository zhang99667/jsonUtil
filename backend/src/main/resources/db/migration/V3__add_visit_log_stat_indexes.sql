-- =====================================================
-- V3: 添加访问日志统计索引
-- 覆盖后台流量概览、路径统计、IP/UV 统计等高频查询
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_visit_logs_created_at
    ON visit_logs (created_at);

CREATE INDEX IF NOT EXISTS idx_visit_logs_path_created_at
    ON visit_logs (path, created_at);

CREATE INDEX IF NOT EXISTS idx_visit_logs_created_at_ip
    ON visit_logs (created_at, ip);
