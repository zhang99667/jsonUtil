package com.jsonhelper.backend.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.validation.ValidationAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class JwtPropertiesTest {

    private static final String LONG_SECRET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789AB";

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(ValidationAutoConfiguration.class))
            .withUserConfiguration(JwtPropertiesConfiguration.class);

    @Test
    void bindsMinimumLegacyMillisecondExpiration() {
        validContext("1").run(context -> {
            assertNull(context.getStartupFailure());
            assertEquals(Duration.ofMillis(1), context.getBean(JwtProperties.class).getExpiration());
        });
    }

    @Test
    void bindsDurationSyntax() {
        validContext("24h").run(context -> {
            assertNull(context.getStartupFailure());
            assertEquals(Duration.ofHours(24), context.getBean(JwtProperties.class).getExpiration());
        });
    }

    @Test
    void bindsExpirationBeyondIntegerMillisecondRange() {
        validContext("30d").run(context -> {
            assertNull(context.getStartupFailure());
            assertEquals(Duration.ofDays(30), context.getBean(JwtProperties.class).getExpiration());
        });
    }

    @Test
    void rejectsExpirationBelowOneMillisecondWithoutLeakingSecret() {
        for (String expiration : new String[] {"0", "1ns"}) {
            validContext(expiration).run(context -> assertInvalidContext(context.getStartupFailure()));
        }
    }

    @Test
    void rejectsNegativeExpirationWithoutLeakingSecret() {
        validContext("-1").run(context -> assertInvalidContext(context.getStartupFailure()));
    }

    @Test
    void rejectsInvalidExpirationFormatWithoutLeakingSecret() {
        validContext("not-a-duration").run(context -> assertInvalidContext(context.getStartupFailure()));
    }

    @Test
    void rejectsMissingExpiration() {
        contextRunner
                .withPropertyValues("jwt.secret=" + LONG_SECRET)
                .run(context -> assertInvalidContext(context.getStartupFailure()));
    }

    @Test
    void rejectsMissingSecret() {
        contextRunner
                .withPropertyValues("jwt.expiration=24h")
                .run(context -> assertNotNull(context.getStartupFailure()));
    }

    @Test
    void rejectsBlankSecret() {
        contextRunner
                .withPropertyValues("jwt.secret=", "jwt.expiration=24h")
                .run(context -> assertNotNull(context.getStartupFailure()));
    }

    @Test
    void stringRepresentationDoesNotExposeSecret() {
        JwtProperties properties = new JwtProperties(LONG_SECRET, Duration.ofDays(1));

        assertFalse(properties.toString().contains(LONG_SECRET));
    }

    private ApplicationContextRunner validContext(String expiration) {
        return contextRunner.withPropertyValues(
                "jwt.secret=" + LONG_SECRET,
                "jwt.expiration=" + expiration
        );
    }

    private void assertInvalidContext(Throwable failure) {
        assertNotNull(failure);
        assertFalse(failureMessages(failure).contains(LONG_SECRET));
    }

    private String failureMessages(Throwable failure) {
        StringBuilder messages = new StringBuilder();
        for (Throwable current = failure; current != null; current = current.getCause()) {
            messages.append('\n').append(current.getMessage());
        }
        return messages.toString();
    }

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(JwtProperties.class)
    static class JwtPropertiesConfiguration {
    }
}
