package com.jsonhelper.backend.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class PathStatsDTO {
    String path;
    long count;
}
