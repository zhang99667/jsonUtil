package com.jsonhelper.backend.dto.response;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class TrafficOverviewDTO {
    private long totalPv;        // 总页面访问量
    private long totalUv;        // 总独立访客数
    private long todayPv;        // 今日PV
    private long todayUv;        // 今日UV
    private double avgDailyPv;   // 日均PV
    private double avgDailyUv;   // 日均UV
    private int days;            // 统计天数
}
