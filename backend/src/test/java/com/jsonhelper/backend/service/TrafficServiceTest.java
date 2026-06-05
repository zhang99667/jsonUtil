package com.jsonhelper.backend.service;

import com.jsonhelper.backend.dto.response.DeviceStatsDTO;
import com.jsonhelper.backend.dto.response.IpStatsDTO;
import com.jsonhelper.backend.dto.response.GeoStatsDTO;
import com.jsonhelper.backend.dto.response.PathStatsDTO;
import com.jsonhelper.backend.dto.response.RefererStatsDTO;
import com.jsonhelper.backend.dto.response.SessionStatsDTO;
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

    private static VisitLogRepository.SessionVisitEvent sessionEvent(String ip, LocalDateTime createdAt) {
        return new TestSessionVisitEvent(ip, createdAt);
    }

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

    @Test
    void nonPositiveDistributionLimitReturnsEmptyWithoutQueryingRepository() {
        assertTrue(trafficService.getDeviceDistribution(7, 0).isEmpty());
        assertTrue(trafficService.getBrowserDistribution(7, -1).isEmpty());
        assertTrue(trafficService.getRefererDistribution(7, 0).isEmpty());

        verifyNoInteractions(visitLogRepository, geoService);
    }

    @Test
    void getDeviceDistributionAggregatesByUserAgentCountBeforeParsingDevice() {
        when(visitLogRepository.countByUserAgentInRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.<Object[]>of(
                        new Object[] { "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", 3L },
                        new Object[] { "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148", 2L }
                ));

        List<DeviceStatsDTO> result = trafficService.getDeviceDistribution(7, 10);

        assertEquals(2, result.size());
        assertEquals("电脑", result.get(0).getDevice());
        assertEquals(3L, result.get(0).getCount());
        assertEquals(60.0, result.get(0).getPercentage());
        assertEquals("手机", result.get(1).getDevice());
        assertEquals(2L, result.get(1).getCount());
        assertEquals(40.0, result.get(1).getPercentage());
    }

    @Test
    void getBrowserDistributionAggregatesByUserAgentCountBeforeParsingBrowser() {
        when(visitLogRepository.countByUserAgentInRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.<Object[]>of(
                        new Object[] {
                                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                                        + "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                                4L
                        },
                        new Object[] {
                                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) "
                                        + "Gecko/20100101 Firefox/125.0",
                                1L
                        }
                ));

        List<DeviceStatsDTO> result = trafficService.getBrowserDistribution(7, 10);

        assertEquals(2, result.size());
        assertEquals("Chrome", result.get(0).getBrowser());
        assertEquals(4L, result.get(0).getCount());
        assertEquals(80.0, result.get(0).getPercentage());
        assertEquals("Firefox", result.get(1).getBrowser());
        assertEquals(1L, result.get(1).getCount());
        assertEquals(20.0, result.get(1).getPercentage());
    }

    @Test
    void getRefererDistributionAggregatesByRefererCountBeforeParsingSource() {
        when(visitLogRepository.countByRefererInRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.<Object[]>of(
                        new Object[] { null, 3L },
                        new Object[] { "https://github.com/example", 2L }
                ));

        List<RefererStatsDTO> result = trafficService.getRefererDistribution(7, 10);

        assertEquals(2, result.size());
        assertEquals("直接访问", result.get(0).getSource());
        assertEquals(3L, result.get(0).getCount());
        assertEquals(60.0, result.get(0).getPercentage());
        assertEquals("技术社区", result.get(1).getSource());
        assertEquals(2L, result.get(1).getCount());
        assertEquals(40.0, result.get(1).getPercentage());
    }

    @Test
    void getSessionDurationStatsUsesOrderedLightweightEvents() {
        LocalDateTime base = LocalDateTime.of(2026, 6, 5, 10, 0);
        when(visitLogRepository.findSessionVisitEvents(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(
                        sessionEvent("10.0.0.1", base),
                        sessionEvent("10.0.0.1", base.plusSeconds(5)),
                        sessionEvent("10.0.0.1", base.plusMinutes(40)),
                        sessionEvent("10.0.0.2", base.plusMinutes(1)),
                        sessionEvent("10.0.0.2", base.plusMinutes(4))
                ));

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
    }

    private static class TestSessionVisitEvent implements VisitLogRepository.SessionVisitEvent {
        private final String ip;
        private final LocalDateTime createdAt;

        private TestSessionVisitEvent(String ip, LocalDateTime createdAt) {
            this.ip = ip;
            this.createdAt = createdAt;
        }

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
