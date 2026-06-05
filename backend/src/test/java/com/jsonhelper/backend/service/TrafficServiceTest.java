package com.jsonhelper.backend.service;

import com.jsonhelper.backend.dto.response.IpStatsDTO;
import com.jsonhelper.backend.dto.response.GeoStatsDTO;
import com.jsonhelper.backend.dto.response.PathStatsDTO;
import com.jsonhelper.backend.repository.VisitLogRepository;
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
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TrafficServiceTest {

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
    void getTopIpsPassesLimitToRepositoryPageable() {
        when(visitLogRepository.countByIpTopN(any(LocalDateTime.class), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(List.<Object[]>of(new Object[] { "127.0.0.1", 3L }));
        when(geoService.parseIp("127.0.0.1"))
                .thenReturn(new GeoService.GeoInfo("本地/内网", "本地/内网", "本地/内网"));

        List<IpStatsDTO> result = trafficService.getTopIps(7, 5);

        assertEquals(1, result.size());
        assertEquals("127.0.0.1", result.get(0).getIp());
        assertEquals(3L, result.get(0).getCount());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(visitLogRepository).countByIpTopN(any(LocalDateTime.class), any(LocalDateTime.class), pageableCaptor.capture());
        assertEquals(0, pageableCaptor.getValue().getPageNumber());
        assertEquals(5, pageableCaptor.getValue().getPageSize());
    }

    @Test
    void getTopPathsPassesLimitToRepositoryPageable() {
        when(visitLogRepository.countByPathTopN(any(LocalDateTime.class), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(List.<Object[]>of(new Object[] { "/admin.html", 8L }));

        List<PathStatsDTO> result = trafficService.getTopPaths(30, 3);

        assertEquals(1, result.size());
        assertEquals("/admin.html", result.get(0).getPath());
        assertEquals(8L, result.get(0).getCount());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(visitLogRepository).countByPathTopN(any(LocalDateTime.class), any(LocalDateTime.class), pageableCaptor.capture());
        assertEquals(0, pageableCaptor.getValue().getPageNumber());
        assertEquals(3, pageableCaptor.getValue().getPageSize());
    }

    @Test
    void nonPositiveTopLimitReturnsEmptyWithoutQueryingRepository() {
        assertTrue(trafficService.getTopIps(7, 0).isEmpty());
        assertTrue(trafficService.getTopPaths(7, -1).isEmpty());

        verifyNoInteractions(visitLogRepository, geoService);
    }

    @Test
    void getGeoDistributionAggregatesByIpCountBeforeParsingRegion() {
        when(visitLogRepository.countByIpInRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.<Object[]>of(
                        new Object[] { "10.0.0.1", 3L },
                        new Object[] { "8.8.8.8", 2L }
                ));
        when(geoService.parseIp("10.0.0.1"))
                .thenReturn(new GeoService.GeoInfo("本地/内网", "本地/内网", "本地/内网"));
        when(geoService.parseIp("8.8.8.8"))
                .thenReturn(new GeoService.GeoInfo("美国", "美国", "美国"));

        List<GeoStatsDTO> result = trafficService.getGeoDistribution(7, 10);

        assertEquals(2, result.size());
        assertEquals("本地/内网", result.get(0).getRegion());
        assertEquals(3L, result.get(0).getCount());
        assertEquals(60.0, result.get(0).getPercentage());
        assertEquals("美国", result.get(1).getRegion());
        assertEquals(2L, result.get(1).getCount());
        assertEquals(40.0, result.get(1).getPercentage());

        verify(geoService, times(1)).parseIp("10.0.0.1");
        verify(geoService, times(1)).parseIp("8.8.8.8");
    }
}
