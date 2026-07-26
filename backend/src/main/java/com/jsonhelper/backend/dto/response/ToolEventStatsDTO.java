package com.jsonhelper.backend.dto.response;

import lombok.Builder;
import lombok.Singular;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class ToolEventStatsDTO {
    long totalEvents;
    long successEvents;
    long failedEvents;
    double failureRate;
    @Singular("topEvent") List<ToolEventGroupDTO> topEvents;
    @Singular("statusItem") List<ToolEventGroupDTO> statusDistribution;
    @Singular("inputSizeItem") List<ToolEventGroupDTO> inputSizeDistribution;
    @Singular("durationItem") List<ToolEventGroupDTO> durationDistribution;
}
