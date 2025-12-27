package com.jsonhelper.backend.dto.response;

import lombok.Data;
import lombok.Builder;

import java.math.BigDecimal;

@Data
@Builder
public class StatisticsDTO {
    private long totalUsers;
    private long activeSubscriptions;
    private BigDecimal totalRevenue;
}
