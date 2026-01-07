package com.jsonhelper.backend.dto.response;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class IpStatsDTO {
    private String ip;      // IP地址
    private long count;     // 访问次数
}