package com.jsonhelper.backend.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ToolEventGroupDTO {
    String label;
    long count;
    double percentage;
}
