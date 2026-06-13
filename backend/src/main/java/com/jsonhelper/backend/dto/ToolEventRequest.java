package com.jsonhelper.backend.dto;

import lombok.Data;

@Data
public class ToolEventRequest {
    private String eventName;
    private String category;
    private String status;
    private String inputSizeBucket;
    private String durationBucket;
    private String source;
}
