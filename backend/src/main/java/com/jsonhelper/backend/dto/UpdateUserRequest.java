package com.jsonhelper.backend.dto;

import lombok.Data;

/**
 * 更新用户信息请求体
 */
@Data
public class UpdateUserRequest {
    private String username;
    private String email;
    private String password; // 为空时不修改密码
    private String role;     // USER 或 ADMIN
    private Boolean enabled; // 启用/禁用
}
