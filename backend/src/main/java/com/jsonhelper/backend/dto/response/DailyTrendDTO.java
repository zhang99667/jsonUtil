package com.jsonhelper.backend.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class DailyTrendDTO {
    String date;
    long pv;
    long uv;
}
