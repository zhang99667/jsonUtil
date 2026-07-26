package com.jsonhelper.backend.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class TrafficOverviewDTO {
    long totalPv;
    long totalUv;
    long todayPv;
    long todayUv;
    double avgDailyPv;
    double avgDailyUv;
    int days;
}
