package com.jsonhelper.backend.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class IpStatsDTO {
    String ip;
    long count;
    String region;
}
