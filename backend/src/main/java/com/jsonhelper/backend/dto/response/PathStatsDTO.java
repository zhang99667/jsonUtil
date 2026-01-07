package com.jsonhelper.backend.dto.response;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PathStatsDTO {
    private String path;    // 访问路径
    private long count;     // 访问次数
}