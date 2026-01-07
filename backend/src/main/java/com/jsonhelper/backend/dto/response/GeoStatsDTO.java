package com.jsonhelper.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeoStatsDTO {
    /**
     * 地区名称（省份或国家）
     */
    private String region;
    
    /**
     * 访问次数
     */
    private long count;
    
    /**
     * 占比（百分比，保留两位小数）
     */
    private double percentage;
}