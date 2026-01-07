package com.jsonhelper.backend.dto.response;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DailyTrendDTO {
    private String date;   // 日期 (yyyy-MM-dd)
    private long pv;       // 当日PV
    private long uv;       // 当日UV
}