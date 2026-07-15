package com.jsonhelper.backend.service;

import com.jsonhelper.backend.dto.ToolEventRequest;
import com.jsonhelper.backend.dto.response.ToolEventGroupDTO;
import com.jsonhelper.backend.dto.response.ToolEventStatsDTO;
import com.jsonhelper.backend.entity.ToolEvent;
import com.jsonhelper.backend.repository.ToolEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ToolEventService {

    private final ToolEventRepository toolEventRepository;

    /**
     * 记录已通过请求边界校验的匿名工具事件，不保存 JSON 原文、路径值或输入长度原值。
     */
    public void recordEvent(ToolEventRequest request) {
        ToolEvent event = new ToolEvent();
        event.setEventName(request.eventName());
        event.setCategory(request.category());
        event.setStatus(request.status());
        event.setInputSizeBucket(request.inputSizeBucket());
        event.setDurationBucket(request.durationBucket());
        event.setSource(request.source());
        toolEventRepository.save(event);
    }

    /**
     * 聚合工具使用事件，用于管理后台判断功能使用、失败率和大输入耗时分布。
     * 多条聚合查询必须共享同一数据库快照，避免并发打点导致总数与分组不一致。
     */
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public ToolEventStatsDTO getStats(int days, int limit) {
        int normalizedDays = Math.max(days, 1);
        int normalizedLimit = Math.max(limit, 1);
        LocalDateTime start = LocalDate.now().minusDays(normalizedDays - 1L).atStartOfDay();

        long totalEvents = toolEventRepository.countByCreatedAtGreaterThanEqual(start);
        long successEvents = toolEventRepository.countByCreatedAtGreaterThanEqualAndStatus(start, "success");
        long failedEvents = toolEventRepository.countByCreatedAtGreaterThanEqualAndStatus(start, "error");

        return ToolEventStatsDTO.builder()
                .totalEvents(totalEvents)
                .successEvents(successEvents)
                .failedEvents(failedEvents)
                .failureRate(roundPercent(failedEvents, totalEvents))
                .topEvents(toGroups(
                        toolEventRepository.countByEventNameSince(start, PageRequest.of(0, normalizedLimit)),
                        totalEvents
                ))
                .statusDistribution(toGroups(toolEventRepository.countByStatusSince(start), totalEvents))
                .inputSizeDistribution(toGroups(toolEventRepository.countByInputSizeBucketSince(start), totalEvents))
                .durationDistribution(toGroups(toolEventRepository.countByDurationBucketSince(start), totalEvents))
                .build();
    }

    private static List<ToolEventGroupDTO> toGroups(List<ToolEventRepository.GroupCount> groups, long total) {
        return groups.stream()
                .map(group -> ToolEventGroupDTO.builder()
                        .label(group.getLabel())
                        .count(group.getCount())
                        .percentage(roundPercent(group.getCount(), total))
                        .build())
                .toList();
    }

    private static double roundPercent(long value, long total) {
        if (total <= 0) {
            return 0;
        }
        return Math.round(value * 10000.0 / total) / 100.0;
    }
}
