package com.jsonhelper.backend.service;

import com.jsonhelper.backend.dto.response.DailyTrendDTO;
import com.jsonhelper.backend.dto.response.HourlyStatsDTO;
import com.jsonhelper.backend.repository.VisitLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TrafficServiceProjectionTest {

    @Mock
    private VisitLogRepository visitLogRepository;

    @Mock
    private GeoService geoService;

    private TrafficService trafficService;

    @BeforeEach
    void setUp() {
        trafficService = new TrafficService(visitLogRepository, geoService);
    }

    @Test
    void dailyTrendReadsTypedDateCountProjections() {
        LocalDate targetDate = LocalDate.now().minusDays(1);
        when(visitLogRepository.countDailyPv(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(dateCount(targetDate, 3L)));
        when(visitLogRepository.countDailyUv(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(dateCount(targetDate, 2L)));

        DailyTrendDTO target = trafficService.getDailyTrend(7).stream()
                .filter(item -> item.getDate().equals(targetDate.toString()))
                .findFirst()
                .orElseThrow();

        assertEquals(3L, target.getPv());
        assertEquals(2L, target.getUv());
    }

    @Test
    void hourlyDistributionReadsTypedHourCountProjection() {
        when(visitLogRepository.countByHour(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(hourCount(7, 4L)));

        List<HourlyStatsDTO> result = trafficService.getHourlyDistribution(7);

        assertEquals(24, result.size());
        assertEquals(4L, result.get(7).getCount());
        assertEquals(0L, result.get(6).getCount());
    }

    private static VisitLogRepository.DateCount dateCount(LocalDate date, long count) {
        return new TestDateCount(date, count);
    }

    private static VisitLogRepository.HourCount hourCount(int hour, long count) {
        return new TestHourCount(hour, count);
    }

    private record TestDateCount(LocalDate date, long count) implements VisitLogRepository.DateCount {
        @Override
        public LocalDate getDate() {
            return date;
        }

        @Override
        public long getCount() {
            return count;
        }
    }

    private record TestHourCount(int hour, long count) implements VisitLogRepository.HourCount {
        @Override
        public int getHour() {
            return hour;
        }

        @Override
        public long getCount() {
            return count;
        }
    }
}
