package com.jsonhelper.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SessionStatsDTO {
    private String durationRange;   // 时长范围：0-10秒/10-30秒/30秒-1分钟/1-3分钟/3-10分钟/10分钟以上
    private long count;             // 会话数量
    private double percentage;      // 占比
}