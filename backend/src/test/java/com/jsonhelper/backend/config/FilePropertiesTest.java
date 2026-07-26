package com.jsonhelper.backend.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.validation.ValidationAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;

import java.util.Set;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FilePropertiesTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(ValidationAutoConfiguration.class))
            .withUserConfiguration(FilePropertiesConfiguration.class);

    @Test
    void appliesCompatibleDefaultsWhenPropertiesAreMissing() {
        contextRunner.run(context -> {
            assertNull(context.getStartupFailure());
            FileProperties properties = context.getBean(FileProperties.class);
            assertEquals("./uploads", properties.getUploadDir());
            assertEquals(52428800L, properties.getMaxUploadSize());
            assertEquals(2097152L, properties.getMaxPreviewSize());
            assertTrue(properties.getAllowedExtensions().containsAll(Set.of(".json", ".md", ".yaml")));
        });
    }

    @Test
    void bindsExistingKeysAndNormalizesExtensionsOnce() {
        contextRunner.withPropertyValues(
                "file.upload-dir=  ./custom-uploads  ",
                "file.max-upload-size=1024",
                "file.max-preview-size=10",
                "file.allowed-extensions=json, .SQL, json"
        ).run(context -> {
            assertNull(context.getStartupFailure());
            FileProperties properties = context.getBean(FileProperties.class);
            assertEquals("./custom-uploads", properties.getUploadDir());
            assertEquals(1024L, properties.getMaxUploadSize());
            assertEquals(10L, properties.getMaxPreviewSize());
            assertEquals(Set.of(".json", ".sql"), properties.getAllowedExtensions());
            assertThrows(
                    UnsupportedOperationException.class,
                    () -> properties.getAllowedExtensions().add(".xml")
            );
        });
    }

    @Test
    void applicationConfigMapsFileEnvironmentVariables() {
        contextRunner
                .withInitializer(new ConfigDataApplicationContextInitializer())
                .withSystemProperties(
                        "FILE_UPLOAD_DIR=./env-uploads",
                        "FILE_MAX_UPLOAD_SIZE_BYTES=2048",
                        "FILE_MAX_PREVIEW_SIZE_BYTES=512",
                        "FILE_ALLOWED_EXTENSIONS=json, TXT"
                )
                .run(context -> {
                    assertNull(context.getStartupFailure());
                    FileProperties properties = context.getBean(FileProperties.class);
                    assertEquals("./env-uploads", properties.getUploadDir());
                    assertEquals(2048L, properties.getMaxUploadSize());
                    assertEquals(512L, properties.getMaxPreviewSize());
                    assertEquals(Set.of(".json", ".txt"), properties.getAllowedExtensions());
                });
    }

    static Stream<String> invalidProperties() {
        return Stream.of(
                "file.upload-dir=",
                "file.max-upload-size=0",
                "file.max-preview-size=-1",
                "file.max-preview-size=2147483647",
                "file.allowed-extensions="
        );
    }

    @ParameterizedTest
    @MethodSource("invalidProperties")
    void rejectsInvalidConfiguration(String property) {
        contextRunner.withPropertyValues(property)
                .run(context -> assertNotNull(context.getStartupFailure()));
    }

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(FileProperties.class)
    static class FilePropertiesConfiguration {
    }
}
