package com.jsonhelper.backend.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class GeoStatsDTO {
    String region;
    long count;
    double percentage;
}
