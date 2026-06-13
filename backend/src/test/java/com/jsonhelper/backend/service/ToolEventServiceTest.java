package com.jsonhelper.backend.service;

import com.jsonhelper.backend.dto.ToolEventRequest;
import com.jsonhelper.backend.dto.response.ToolEventStatsDTO;
import com.jsonhelper.backend.entity.ToolEvent;
import com.jsonhelper.backend.repository.ToolEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ToolEventServiceTest {

    @Mock
    private ToolEventRepository toolEventRepository;

    private ToolEventService toolEventService;

    @BeforeEach
    void setUp() {
        toolEventService = new ToolEventService(toolEventRepository);
    }

    @Test
    void recordEventNormalizesUnsafeFieldsAndBuckets() {
        ToolEventRequest request = new ToolEventRequest();
        request.setEventName("AI FIX!");
        request.setCategory("ai repair");
        request.setStatus("bad-status");
        request.setInputSizeBucket("bad-size");
        request.setDurationBucket("2_10s");
        request.setSource("web/main");

        toolEventService.recordEvent(request);

        ArgumentCaptor<ToolEvent> eventCaptor = ArgumentCaptor.forClass(ToolEvent.class);
        verify(toolEventRepository).save(eventCaptor.capture());
        ToolEvent event = eventCaptor.getValue();

        assertEquals("AI_FIX_", event.getEventName());
        assertEquals("ai_repair", event.getCategory());
        assertEquals("success", event.getStatus());
        assertEquals("unknown", event.getInputSizeBucket());
        assertEquals("2_10s", event.getDurationBucket());
        assertEquals("web_main", event.getSource());
    }

    @Test
    void getStatsAggregatesEventGroupsAndFailureRate() {
        when(toolEventRepository.countByCreatedAtGreaterThanEqual(any(LocalDateTime.class)))
                .thenReturn(4L);
        when(toolEventRepository.countByCreatedAtGreaterThanEqualAndStatus(any(LocalDateTime.class), eq("success")))
                .thenReturn(3L);
        when(toolEventRepository.countByCreatedAtGreaterThanEqualAndStatus(any(LocalDateTime.class), eq("error")))
                .thenReturn(1L);
        when(toolEventRepository.countByEventNameSince(any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(List.of(new TestGroupCount("DEEP_FORMAT", 2L), new TestGroupCount("AI_FIX", 1L)));
        when(toolEventRepository.countByStatusSince(any(LocalDateTime.class)))
                .thenReturn(List.of(new TestGroupCount("success", 3L), new TestGroupCount("error", 1L)));
        when(toolEventRepository.countByInputSizeBucketSince(any(LocalDateTime.class)))
                .thenReturn(List.of(new TestGroupCount("50_250kb", 2L)));
        when(toolEventRepository.countByDurationBucketSince(any(LocalDateTime.class)))
                .thenReturn(List.of(new TestGroupCount("100_500ms", 3L)));

        ToolEventStatsDTO stats = toolEventService.getStats(7, 5);

        assertEquals(4L, stats.getTotalEvents());
        assertEquals(3L, stats.getSuccessEvents());
        assertEquals(1L, stats.getFailedEvents());
        assertEquals(25.0, stats.getFailureRate());
        assertEquals("DEEP_FORMAT", stats.getTopEvents().get(0).getLabel());
        assertEquals(50.0, stats.getTopEvents().get(0).getPercentage());
        assertEquals("50_250kb", stats.getInputSizeDistribution().get(0).getLabel());
        assertEquals(75.0, stats.getDurationDistribution().get(0).getPercentage());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(toolEventRepository).countByEventNameSince(any(LocalDateTime.class), pageableCaptor.capture());
        assertEquals(5, pageableCaptor.getValue().getPageSize());
    }

    private static class TestGroupCount implements ToolEventRepository.GroupCount {
        private final String label;
        private final long count;

        private TestGroupCount(String label, long count) {
            this.label = label;
            this.count = count;
        }

        @Override
        public String getLabel() {
            return label;
        }

        @Override
        public long getCount() {
            return count;
        }
    }
}
