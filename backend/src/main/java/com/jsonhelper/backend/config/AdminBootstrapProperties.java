package com.jsonhelper.backend.config;

import jakarta.validation.constraints.AssertTrue;
import lombok.Getter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/**
 * 首个管理员账号的启动配置。
 * 仅在显式启用时校验凭据，密码始终保留配置原值供编码器使用。
 */
@Validated
@ConfigurationProperties("admin.bootstrap")
@Getter
public final class AdminBootstrapProperties {

    private static final String DEFAULT_EMAIL = "admin@example.com";

    private final boolean enabled;
    private final String username;
    private final String password;
    private final String email;

    public AdminBootstrapProperties(
            @DefaultValue("false") boolean enabled,
            String username,
            String password,
            @DefaultValue(DEFAULT_EMAIL) String email
    ) {
        this.enabled = enabled;
        this.username = username == null ? "" : username.trim();
        this.password = password == null ? "" : password;
        this.email = email == null ? DEFAULT_EMAIL : email.trim();
    }

    @AssertTrue(message = "已启用管理员初始化，但管理员用户名、密码或邮箱未完整配置")
    public boolean isRequiredConfigurationPresent() {
        return !enabled || (!username.isEmpty() && !password.strip().isEmpty() && !email.isEmpty());
    }

    @AssertTrue(message = "管理员初始化密码不符合要求，请配置至少 8 位且非示例值的 ADMIN_BOOTSTRAP_PASSWORD")
    public boolean isPasswordSecure() {
        String passwordForValidation = password.strip();
        if (!enabled || passwordForValidation.isEmpty()) {
            return true;
        }
        return passwordForValidation.length() >= 8 && !passwordForValidation.startsWith("change-me");
    }
}
