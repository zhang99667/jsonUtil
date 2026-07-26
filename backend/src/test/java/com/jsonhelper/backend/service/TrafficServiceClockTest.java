package com.jsonhelper.backend.service;

import com.jsonhelper.backend.dto.response.DailyTrendDTO;
import com.jsonhelper.backend.dto.response.TrafficOverviewDTO;
import com.jsonhelper.backend.repository.VisitLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TrafficServiceClockTest {

    private static final ZoneId TEST_ZONE = ZoneId.of("Asia/Shanghai");
    private static final Clock MIDNIGHT_CLOCK = Clock.fixed(
            Instant.parse("2026-06-05T16:00:00.125Z"),
            TEST_ZONE
    );

    @Mock
    private VisitLogRepository visitLogRepository;

    @Test
    void getOverviewUsesOneTimeBasisAcrossMidnightBoundary() {
        when(visitLogRepository.countTotalPv(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(10L, 2L);
        when(visitLogRepository.countTotalUv(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(8L, 1L);
        TrafficService trafficService = new TrafficService(
                visitLogRepository,
                new GeoService(),
                new UserAgentClassifier(),
                MIDNIGHT_CLOCK
        );

        TrafficOverviewDTO result = trafficService.getOverview(2);

        assertEquals(10L, result.getTotalPv());
        assertEquals(2L, result.getTodayPv());
        assertEquals(8L, result.getTotalUv());
        assertEquals(1L, result.getTodayUv());

        ArgumentCaptor<LocalDateTime> pvStartCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> pvEndCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(visitLogRepository, times(2)).countTotalPv(pvStartCaptor.capture(), pvEndCaptor.capture());
        assertEquals(
                List.of(
                        LocalDateTime.of(2026, 6, 5, 0, 0),
                        LocalDateTime.of(2026, 6, 6, 0, 0)
                ),
                pvStartCaptor.getAllValues()
        );
        assertEquals(
                List.of(
                        LocalDateTime.of(2026, 6, 6, 0, 0, 0, 125_000_000),
                        LocalDateTime.of(2026, 6, 6, 0, 0, 0, 125_000_000)
                ),
                pvEndCaptor.getAllValues()
        );
    }

    @Test
    void getDailyTrendBuildsDatesFromFixedBoundarySnapshot() {
        when(visitLogRepository.countDailyPv(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());
        when(visitLogRepository.countDailyUv(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());
        TrafficService trafficService = new TrafficService(
                visitLogRepository,
                new GeoService(),
                new UserAgentClassifier(),
                MIDNIGHT_CLOCK
        );

        List<DailyTrendDTO> result = trafficService.getDailyTrend(2);

        assertEquals(List.of("2026-06-05", "2026-06-06"), result.stream().map(DailyTrendDTO::getDate).toList());
        assertEquals(List.of(0L, 0L), result.stream().map(DailyTrendDTO::getPv).toList());
        assertEquals(List.of(0L, 0L), result.stream().map(DailyTrendDTO::getUv).toList());

        ArgumentCaptor<LocalDateTime> startCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> endCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(visitLogRepository).countDailyPv(startCaptor.capture(), endCaptor.capture());
        assertEquals(LocalDateTime.of(2026, 6, 5, 0, 0), startCaptor.getValue());
        assertEquals(LocalDateTime.of(2026, 6, 6, 0, 0, 0, 125_000_000), endCaptor.getValue());
    }
}
