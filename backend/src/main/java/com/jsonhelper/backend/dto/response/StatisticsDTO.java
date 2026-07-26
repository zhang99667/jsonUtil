package com.jsonhelper.backend.dto.response;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class StatisticsDTO {
    long totalUsers;
    long activeSubscriptions;
    BigDecimal totalRevenue;
    long todayPv;
    long todayUv;
}
