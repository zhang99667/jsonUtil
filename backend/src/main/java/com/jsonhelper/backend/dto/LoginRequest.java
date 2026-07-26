package com.jsonhelper.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "用户名不能为空")
        @Size(max = 255, message = "用户名不能超过 255 个字符")
        String username,
        @NotBlank(message = "密码不能为空")
        @Size(max = 255, message = "密码不能超过 255 个字符")
        String password
) {
}
