package com.jsonhelper.backend.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 文件存储配置。
 * 绑定时统一校验大小边界并规范化扩展名，避免业务请求重复解析配置。
 */
@Validated
@ConfigurationProperties("file")
@Getter
public final class FileProperties {

    private static final String DEFAULT_ALLOWED_EXTENSIONS = ".conf,.config,.css,.csv,.env,.geojson,.har,.html,.ini,.java,.js,.json,.json5,.jsonc,.jsonl,.jsx,.log,.map,.md,.ndjson,.properties,.sql,.topojson,.toml,.ts,.tsx,.txt,.webmanifest,.xml,.yaml,.yml";

    @NotBlank(message = "文件上传目录不能为空")
    private final String uploadDir;

    @Positive(message = "文件上传大小上限必须大于零")
    private final long maxUploadSize;

    @Min(value = 0, message = "文件预览大小上限不能小于零")
    @Max(value = Integer.MAX_VALUE - 1L, message = "文件预览大小上限不能超过 2147483646 字节")
    private final long maxPreviewSize;

    @NotEmpty(message = "允许上传的文件扩展名不能为空")
    private final Set<String> allowedExtensions;

    public FileProperties(
            @DefaultValue("./uploads") String uploadDir,
            @DefaultValue("52428800") long maxUploadSize,
            @DefaultValue("2097152") long maxPreviewSize,
            @DefaultValue(DEFAULT_ALLOWED_EXTENSIONS) String allowedExtensions
    ) {
        this.uploadDir = uploadDir == null ? "" : uploadDir.trim();
        this.maxUploadSize = maxUploadSize;
        this.maxPreviewSize = maxPreviewSize;
        this.allowedExtensions = normalizeExtensions(allowedExtensions);
    }

    private static Set<String> normalizeExtensions(String configuredExtensions) {
        if (configuredExtensions == null) {
            return Set.of();
        }

        LinkedHashSet<String> normalized = Arrays.stream(configuredExtensions.split(","))
                .map(FileProperties::normalizeExtension)
                .filter(item -> !item.isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new));
        return Collections.unmodifiableSet(normalized);
    }

    private static String normalizeExtension(String extension) {
        String normalized = extension.trim().toLowerCase(Locale.ROOT);
        if (normalized.isEmpty() || normalized.startsWith(".")) {
            return normalized;
        }
        return "." + normalized;
    }
}
