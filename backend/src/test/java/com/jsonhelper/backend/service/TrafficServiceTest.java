package com.jsonhelper.backend.service;

import com.jsonhelper.backend.dto.response.DeviceStatsDTO;
import com.jsonhelper.backend.dto.response.IpStatsDTO;
import com.jsonhelper.backend.dto.response.GeoStatsDTO;
import com.jsonhelper.backend.dto.response.PathStatsDTO;
import com.jsonhelper.backend.dto.response.RefererStatsDTO;
import com.jsonhelper.backend.repository.VisitLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TrafficServiceTest {

    @Mock
    private VisitLogRepository visitLogRepository;

    @Mock
    private UserAgentClassifier userAgentClassifier;

    private StubGeoService geoService;

    private TrafficService trafficService;

    private static VisitLogRepository.GroupCount valueCount(String value, long count) {
        return new TestGroupCount(value, count);
    }

    private record TestGroupCount(String value, long count) implements VisitLogRepository.GroupCount {
        @Override
        public String getLabel() {
            return value;
        }

        @Override
        public long getCount() {
            return count;
        }
    }

    @BeforeEach
    void setUp() {
        geoService = new StubGeoService();
        trafficService = new TrafficService(visitLogRepository, geoService, userAgentClassifier);
    }

    @Test
    void getTopIpsPassesLimitToRepositoryPageable() {
        when(visitLogRepository.countByIpTopN(any(LocalDateTime.class), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(List.of(valueCount("127.0.0.1", 3L)));
        geoService.addResult("127.0.0.1", new GeoService.GeoInfo("本地/内网", "本地/内网", "本地/内网"));

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
                .thenReturn(List.of(valueCount("/admin.html", 8L)));

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

        verifyNoInteractions(visitLogRepository);
        assertEquals(0, geoService.totalCalls());
    }

    @Test
    void getGeoDistributionAggregatesByIpCountBeforeParsingRegion() {
        when(visitLogRepository.countByIpInRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(
                        valueCount("10.0.0.1", 3L),
                        valueCount("8.8.8.8", 2L)
                ));
        geoService.addResult("10.0.0.1", new GeoService.GeoInfo("本地/内网", "本地/内网", "本地/内网"));
        geoService.addResult("8.8.8.8", new GeoService.GeoInfo("美国", "美国", "美国"));

        List<GeoStatsDTO> result = trafficService.getGeoDistribution(7, 10);

        assertEquals(2, result.size());
        assertEquals("本地/内网", result.get(0).getRegion());
        assertEquals(3L, result.get(0).getCount());
        assertEquals(60.0, result.get(0).getPercentage());
        assertEquals("美国", result.get(1).getRegion());
        assertEquals(2L, result.get(1).getCount());
        assertEquals(40.0, result.get(1).getPercentage());

        assertEquals(1, geoService.callsFor("10.0.0.1"));
        assertEquals(1, geoService.callsFor("8.8.8.8"));
    }

    @Test
    void nonPositiveDistributionLimitReturnsEmptyWithoutQueryingRepository() {
        assertTrue(trafficService.getDeviceDistribution(7, 0).isEmpty());
        assertTrue(trafficService.getBrowserDistribution(7, -1).isEmpty());
        assertTrue(trafficService.getRefererDistribution(7, 0).isEmpty());

        verifyNoInteractions(visitLogRepository);
        assertEquals(0, geoService.totalCalls());
    }

    @Test
    void getDeviceDistributionAggregatesByUserAgentCountBeforeParsingDevice() {
        when(userAgentClassifier.classifyDevice(any())).thenReturn("电脑", "手机");
        when(visitLogRepository.countByUserAgentInRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(
                        valueCount("Mozilla/5.0 (Windows NT 10.0; Win64; x64)", 3L),
                        valueCount("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148", 2L)
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
    void distributionCountTiesUseCategoryAsStableOrder() {
        when(userAgentClassifier.classifyDevice(any())).thenReturn("Aa", "BB");
        when(visitLogRepository.countByUserAgentInRange(any(), any()))
                .thenReturn(List.of(valueCount("BB", 1L), valueCount("Aa", 1L)));
        assertEquals("Aa", trafficService.getDeviceDistribution(7, 1).get(0).getDevice());
    }

    @Test
    void getBrowserDistributionAggregatesByUserAgentCountBeforeParsingBrowser() {
        when(userAgentClassifier.classifyBrowser(any())).thenReturn("Chrome", "Firefox");
        when(visitLogRepository.countByUserAgentInRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(
                        valueCount(
                                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                                        + "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                                4L
                        ),
                        valueCount(
                                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) "
                                        + "Gecko/20100101 Firefox/125.0",
                                1L
                        )
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
                .thenReturn(List.of(
                        valueCount(null, 3L),
                        valueCount("https://github.com/example", 2L)
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
    void getRefererDistributionOnlyClassifiesTrustedHostNames() {
        when(visitLogRepository.countByRefererInRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(
                        valueCount("https://evil.example/path?next=https://jsonutils.markz.fun", 1L),
                        valueCount("https://github.com.evil.example/path", 1L),
                        valueCount("https://evil.example/path/github.com", 1L),
                        valueCount("https://notso.com/path", 1L),
                        valueCount("https://github.com/openai", 2L)
                ));

        List<RefererStatsDTO> result = trafficService.getRefererDistribution(7, 10);
        Map<String, Long> countsBySource = new HashMap<>();
        result.forEach(item -> countsBySource.put(item.getSource(), item.getCount()));

        assertEquals(4L, countsBySource.get("外部链接"));
        assertEquals(2L, countsBySource.get("技术社区"));
        assertEquals(2, countsBySource.size());
    }

    private static class StubGeoService extends GeoService {
        private final Map<String, GeoInfo> results = new HashMap<>();
        private final Map<String, Integer> calls = new HashMap<>();

        void addResult(String ip, GeoInfo result) {
            results.put(ip, result);
        }

        int callsFor(String ip) {
            return calls.getOrDefault(ip, 0);
        }

        int totalCalls() {
            return calls.values().stream().mapToInt(Integer::intValue).sum();
        }

        @Override
        public GeoInfo parseIp(String ip) {
            calls.merge(ip, 1, Integer::sum);
            return results.getOrDefault(ip, new GeoInfo("未知", "未知", "未知"));
        }
    }
}
