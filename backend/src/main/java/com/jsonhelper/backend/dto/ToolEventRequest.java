package com.jsonhelper.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ToolEventRequest(
        @NotBlank(message = "事件名称不能为空")
        @Size(max = 64, message = "事件名称不能超过 64 个字符")
        @Pattern(regexp = "[A-Za-z0-9_.:-]+", message = "事件名称包含非法字符")
        String eventName,

        @NotBlank(message = "事件分类不能为空")
        @Size(max = 48, message = "事件分类不能超过 48 个字符")
        @Pattern(regexp = "[A-Za-z0-9_.:-]+", message = "事件分类包含非法字符")
        String category,

        @NotBlank(message = "事件状态不能为空")
        @Pattern(
                regexp = "success|error|skipped|cancelled",
                message = "事件状态不在允许范围内"
        )
        String status,

        @NotBlank(message = "输入大小分桶不能为空")
        @Pattern(
                regexp = "empty|lt_10kb|10_50kb|50_250kb|250kb_1mb|gt_1mb|unknown",
                message = "输入大小分桶不在允许范围内"
        )
        String inputSizeBucket,

        @NotBlank(message = "耗时分桶不能为空")
        @Pattern(
                regexp = "instant|lt_100ms|100_500ms|500ms_2s|2_10s|gt_10s|unknown",
                message = "耗时分桶不在允许范围内"
        )
        String durationBucket,

        @NotBlank(message = "事件来源不能为空")
        @Size(max = 24, message = "事件来源不能超过 24 个字符")
        @Pattern(regexp = "[A-Za-z0-9_.:-]+", message = "事件来源包含非法字符")
        String source
) {
}
