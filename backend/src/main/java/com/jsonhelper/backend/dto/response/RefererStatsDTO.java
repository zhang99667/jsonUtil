package com.jsonhelper.backend.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class RefererStatsDTO {
    String source;
    String domain;
    long count;
    double percentage;
}
