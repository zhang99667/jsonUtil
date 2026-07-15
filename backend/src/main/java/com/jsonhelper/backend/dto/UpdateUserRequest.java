package com.jsonhelper.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 更新用户信息请求体
 */
@Data
public class UpdateUserRequest {
    @Pattern(regexp = "(?s).*\\S.*", message = "用户名不能只包含空白字符")
    @Size(max = 255, message = "用户名不能超过 255 个字符")
    private String username;

    @Email(message = "邮箱格式不合法")
    @Size(max = 255, message = "邮箱不能超过 255 个字符")
    private String email;

    @Size(max = 255, message = "密码不能超过 255 个字符")
    private String password;

    @Pattern(regexp = "(?i)USER|ADMIN", message = "角色只能是 USER 或 ADMIN")
    private String role;

    private Boolean enabled;
}
