package com.jsonhelper.backend.service;

import com.jsonhelper.backend.dto.response.SessionStatsDTO;
import com.jsonhelper.backend.repository.VisitLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TrafficServiceSessionStatsTest {

    @Mock
    private VisitLogRepository visitLogRepository;

    @Mock
    private UserAgentClassifier userAgentClassifier;

    private TrafficService trafficService;

    private static VisitLogRepository.SessionVisitEvent sessionEvent(String ip, LocalDateTime createdAt) {
        return new TestSessionVisitEvent(ip, createdAt);
    }

    @BeforeEach
    void setUp() {
        trafficService = new TrafficService(visitLogRepository, new GeoService(), userAgentClassifier);
    }

    @Test
    void getSessionDurationStatsUsesOrderedLightweightEvents() {
        LocalDateTime base = LocalDateTime.of(2026, 6, 5, 10, 0);
        AtomicBoolean streamClosed = new AtomicBoolean();
        when(visitLogRepository.streamSessionVisitEvents(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Stream.of(
                        sessionEvent("10.0.0.1", base),
                        sessionEvent("10.0.0.1", base.plusSeconds(5)),
                        sessionEvent("10.0.0.1", base.plusMinutes(40)),
                        sessionEvent("10.0.0.2", base.plusMinutes(1)),
                        sessionEvent("10.0.0.2", base.plusMinutes(4))
                ).onClose(() -> streamClosed.set(true)));

        List<SessionStatsDTO> result = trafficService.getSessionDurationStats(7);

        assertEquals(6, result.size());
        assertEquals("0-10秒", result.get(0).getDurationRange());
        assertEquals(1L, result.get(0).getCount());
        assertEquals(33.33, result.get(0).getPercentage());
        assertEquals("10-30秒", result.get(1).getDurationRange());
        assertEquals(1L, result.get(1).getCount());
        assertEquals(33.33, result.get(1).getPercentage());
        assertEquals("3-10分钟", result.get(4).getDurationRange());
        assertEquals(1L, result.get(4).getCount());
        assertEquals(33.33, result.get(4).getPercentage());
        assertTrue(streamClosed.get());
    }

    @Test
    void getSessionDurationStatsStartsNewSessionAfterThirtyMinutes() {
        LocalDateTime base = LocalDateTime.of(2026, 6, 5, 10, 0);
        when(visitLogRepository.streamSessionVisitEvents(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Stream.of(
                        sessionEvent("10.0.0.1", base),
                        sessionEvent("10.0.0.1", base.plusMinutes(30).plusSeconds(1))
                ));

        List<SessionStatsDTO> result = trafficService.getSessionDurationStats(7);

        assertEquals(2L, result.get(1).getCount());
        assertEquals(100.0, result.get(1).getPercentage());
        assertEquals(0L, result.get(5).getCount());
    }

    @Test
    void getSessionDurationStatsKeepsSessionAtThirtyMinuteBoundary() {
        LocalDateTime base = LocalDateTime.of(2026, 6, 5, 10, 0);
        when(visitLogRepository.streamSessionVisitEvents(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Stream.of(
                        sessionEvent("10.0.0.1", base),
                        sessionEvent("10.0.0.1", base.plusMinutes(30))
                ));

        List<SessionStatsDTO> result = trafficService.getSessionDurationStats(7);

        assertEquals(0L, result.get(1).getCount());
        assertEquals(1L, result.get(5).getCount());
        assertEquals(100.0, result.get(5).getPercentage());
    }

    private record TestSessionVisitEvent(String ip, LocalDateTime createdAt)
            implements VisitLogRepository.SessionVisitEvent {
        @Override
        public String getIp() {
            return ip;
        }

        @Override
        public LocalDateTime getCreatedAt() {
            return createdAt;
        }
    }
}
