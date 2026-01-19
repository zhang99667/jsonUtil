package com.jsonhelper.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DeviceStatsDTO {
    private String device;      // 设备类型：PC/Mobile/Tablet/Bot/Unknown
    private String browser;     // 浏览器：Chrome/Firefox/Safari/Edge/...
    private long count;
    private double percentage;
}