package com.jsonhelper.backend.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.validation.ValidationAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AdminBootstrapPropertiesTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(ValidationAutoConfiguration.class))
            .withUserConfiguration(AdminBootstrapPropertiesConfiguration.class);

    @Test
    void appliesCompatibleDefaultsWhenPropertiesAreMissing() {
        contextRunner.run(context -> {
            assertNull(context.getStartupFailure());
            AdminBootstrapProperties properties = context.getBean(AdminBootstrapProperties.class);
            assertFalse(properties.isEnabled());
            assertEquals("", properties.getUsername());
            assertEquals("", properties.getPassword());
            assertEquals("admin@example.com", properties.getEmail());
        });
    }

    @Test
    void disabledBootstrapAllowsEmptyOrExampleCredentials() {
        contextRunner.withPropertyValues(
                "admin.bootstrap.enabled=false",
                "admin.bootstrap.password=change-me"
        ).run(context -> assertNull(context.getStartupFailure()));
    }

    @Test
    void normalizesUsernameAndEmailAndPreservesPasswordValue() {
        AdminBootstrapProperties properties = new AdminBootstrapProperties(
                true,
                "  admin  ",
                "  strong-password  ",
                "  owner@example.com  "
        );

        assertEquals("admin", properties.getUsername());
        assertEquals("  strong-password  ", properties.getPassword());
        assertEquals("owner@example.com", properties.getEmail());
    }

    @Test
    void enabledBootstrapUsesDefaultEmailWhenPropertyIsMissing() {
        contextRunner.withPropertyValues(
                "admin.bootstrap.enabled=true",
                "admin.bootstrap.username=admin",
                "admin.bootstrap.password=strong-password"
        ).run(context -> {
            assertNull(context.getStartupFailure());
            assertEquals(
                    "admin@example.com",
                    context.getBean(AdminBootstrapProperties.class).getEmail()
            );
        });
    }

    @Test
    void applicationConfigMapsBootstrapEnvironmentVariables() {
        contextRunner
                .withInitializer(new ConfigDataApplicationContextInitializer())
                .withSystemProperties(
                        "ADMIN_BOOTSTRAP_ENABLED=true",
                        "ADMIN_BOOTSTRAP_USERNAME=bootstrap-admin",
                        "ADMIN_BOOTSTRAP_PASSWORD=strong-password",
                        "ADMIN_BOOTSTRAP_EMAIL=owner@example.com"
                )
                .run(context -> {
                    assertNull(context.getStartupFailure());
                    AdminBootstrapProperties properties = context.getBean(AdminBootstrapProperties.class);
                    assertTrue(properties.isEnabled());
                    assertEquals("bootstrap-admin", properties.getUsername());
                    assertEquals("strong-password", properties.getPassword());
                    assertEquals("owner@example.com", properties.getEmail());
                });
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "admin.bootstrap.username=admin",
            "admin.bootstrap.password=strong-password"
    })
    void rejectsEnabledBootstrapWithMissingCredential(String configuredCredential) {
        contextRunner.withPropertyValues(
                "admin.bootstrap.enabled=true",
                configuredCredential
        ).run(context -> assertNotNull(context.getStartupFailure()));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   "})
    void rejectsEnabledBootstrapWithBlankEmail(String email) {
        contextRunner.withPropertyValues(
                "admin.bootstrap.enabled=true",
                "admin.bootstrap.username=admin",
                "admin.bootstrap.password=strong-password",
                "admin.bootstrap.email=" + email
        ).run(context -> assertNotNull(context.getStartupFailure()));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "short",
            "  short  ",
            "change-me",
            "  change-me-secret  "
    })
    void rejectsWeakPasswordWithoutLeakingConfiguredValue(String password) {
        contextRunner.withPropertyValues(
                "admin.bootstrap.enabled=true",
                "admin.bootstrap.username=admin",
                "admin.bootstrap.password=" + password
        ).run(context -> {
            Throwable failure = context.getStartupFailure();
            assertNotNull(failure);
            assertFalse(failureMessages(failure).contains(password));
        });
    }

    private String failureMessages(Throwable failure) {
        StringBuilder messages = new StringBuilder();
        for (Throwable current = failure; current != null; current = current.getCause()) {
            messages.append('\n').append(current.getMessage());
        }
        return messages.toString();
    }

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(AdminBootstrapProperties.class)
    static class AdminBootstrapPropertiesConfiguration {
    }
}
