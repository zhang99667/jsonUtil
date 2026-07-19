package com.jsonhelper.backend.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import org.hibernate.validator.constraints.time.DurationMin;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.convert.DurationUnit;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;
import java.time.temporal.ChronoUnit;

@Validated
@ConfigurationProperties("jwt")
@Getter
public final class JwtProperties {

    @NotBlank(message = "JWT 密钥不能为空")
    private final String secret;

    @NotNull(message = "JWT 有效期不能为空")
    @DurationMin(millis = 1, message = "JWT 有效期不能小于 1 毫秒")
    @DurationUnit(ChronoUnit.MILLIS)
    private final Duration expiration;

    public JwtProperties(
            String secret,
            @DurationUnit(ChronoUnit.MILLIS) Duration expiration
    ) {
        this.secret = secret;
        this.expiration = expiration;
    }
}
