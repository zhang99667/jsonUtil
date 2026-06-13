package com.jsonhelper.backend.service;

import com.jsonhelper.backend.dto.ToolEventRequest;
import com.jsonhelper.backend.dto.response.ToolEventGroupDTO;
import com.jsonhelper.backend.dto.response.ToolEventStatsDTO;
import com.jsonhelper.backend.entity.ToolEvent;
import com.jsonhelper.backend.repository.ToolEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ToolEventService {

    private static final Set<String> KNOWN_STATUS = Set.of("success", "error", "skipped", "cancelled");
    private static final Set<String> KNOWN_INPUT_SIZE_BUCKET = Set.of(
            "empty", "lt_10kb", "10_50kb", "50_250kb", "250kb_1mb", "gt_1mb", "unknown"
    );
    private static final Set<String> KNOWN_DURATION_BUCKET = Set.of(
            "instant", "lt_100ms", "100_500ms", "500ms_2s", "2_10s", "gt_10s", "unknown"
    );

    private final ToolEventRepository toolEventRepository;

    /**
     * 记录匿名工具事件。这里只保存枚举和分桶，不保存 JSON 原文、路径值或输入长度原值。
     */
    public void recordEvent(ToolEventRequest request) {
        if (request == null) {
            return;
        }

        ToolEvent event = new ToolEvent();
        event.setEventName(normalizeText(request.getEventName(), "unknown", 64));
        event.setCategory(normalizeText(request.getCategory(), "tool", 48));
        event.setStatus(normalizeStatus(request.getStatus()));
        event.setInputSizeBucket(normalizeBucket(
                request.getInputSizeBucket(),
                KNOWN_INPUT_SIZE_BUCKET,
                "unknown"
        ));
        event.setDurationBucket(normalizeBucket(
                request.getDurationBucket(),
                KNOWN_DURATION_BUCKET,
                "unknown"
        ));
        event.setSource(normalizeText(request.getSource(), "web", 24));
        toolEventRepository.save(event);
    }

    /**
     * 聚合工具使用事件，用于管理后台判断功能使用、失败率和大输入耗时分布。
     */
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

    private static String normalizeStatus(String value) {
        return normalizeBucket(value, KNOWN_STATUS, "success");
    }

    private static String normalizeBucket(String value, Set<String> allowedValues, String fallback) {
        String normalized = normalizeText(value, fallback, 24).toLowerCase(Locale.ROOT);
        return allowedValues.contains(normalized) ? normalized : fallback;
    }

    private static String normalizeText(String value, String fallback, int maxLength) {
        if (value == null || value.trim().isEmpty()) {
            return fallback;
        }
        String normalized = value.trim().replaceAll("[^A-Za-z0-9_.:-]", "_");
        if (normalized.isEmpty()) {
            return fallback;
        }
        return normalized.length() > maxLength ? normalized.substring(0, maxLength) : normalized;
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
