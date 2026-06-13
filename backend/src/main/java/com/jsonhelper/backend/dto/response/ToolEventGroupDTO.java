package com.jsonhelper.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ToolEventGroupDTO {
    private String label;
    private long count;
    private double percentage;
}
