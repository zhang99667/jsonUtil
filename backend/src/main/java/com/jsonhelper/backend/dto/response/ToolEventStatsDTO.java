package com.jsonhelper.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ToolEventStatsDTO {
    private long totalEvents;
    private long successEvents;
    private long failedEvents;
    private double failureRate;
    private List<ToolEventGroupDTO> topEvents;
    private List<ToolEventGroupDTO> statusDistribution;
    private List<ToolEventGroupDTO> inputSizeDistribution;
    private List<ToolEventGroupDTO> durationDistribution;
}
