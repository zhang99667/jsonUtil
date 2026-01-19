package com.jsonhelper.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RefererStatsDTO {
    private String source;      // 来源分类：直接访问/搜索引擎/社交媒体/外部链接/本站
    private String domain;      // 来源域名
    private long count;
    private double percentage;
}