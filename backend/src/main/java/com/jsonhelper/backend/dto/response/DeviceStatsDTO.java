package com.jsonhelper.backend.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class DeviceStatsDTO {
    String device;
    String browser;
    long count;
    double percentage;
}
