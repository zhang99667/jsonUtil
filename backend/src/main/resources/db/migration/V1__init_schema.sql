-- =====================================================
-- V1: 初始化数据库表结构
-- 包含所有已有表: users, visit_logs, orders, subscriptions
-- =====================================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id             BIGSERIAL    PRIMARY KEY,
    username       VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    email          VARCHAR(255),
    role           VARCHAR(255),
    enabled        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 访问日志表
CREATE TABLE IF NOT EXISTS visit_logs (
    id             BIGSERIAL      PRIMARY KEY,
    ip             VARCHAR(255),
    path           VARCHAR(255),
    method         VARCHAR(255),
    user_agent     VARCHAR(512),
    referer        VARCHAR(1024),
    created_at     TIMESTAMP
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id             BIGSERIAL      PRIMARY KEY,
    order_no       VARCHAR(255)   NOT NULL UNIQUE,
    user_id        BIGINT         NOT NULL,
    amount         DECIMAL(19,2)  NOT NULL,
    channel        VARCHAR(255)   NOT NULL,
    status         VARCHAR(255)   NOT NULL,
    created_at     TIMESTAMP      NOT NULL DEFAULT NOW(),
    paid_at        TIMESTAMP
);

-- 订阅表
CREATE TABLE IF NOT EXISTS subscriptions (
    id             BIGSERIAL    PRIMARY KEY,
    user_id        BIGINT       NOT NULL,
    status         VARCHAR(255) NOT NULL,
    expire_time    TIMESTAMP,
    updated_at     TIMESTAMP
);
