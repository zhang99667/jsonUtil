package com.jsonhelper.backend.security;

import com.jsonhelper.backend.entity.VisitLog;
import com.jsonhelper.backend.repository.VisitLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TrafficFilterTest {

    @Mock
    private VisitLogRepository visitLogRepository;

    private TrafficFilter trafficFilter;

    @BeforeEach
    void setUp() {
        trafficFilter = new TrafficFilter(visitLogRepository);
    }

    @Test
    void healthCheckDoesNotPersistVisitLog() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/health");
        MockHttpServletResponse response = new MockHttpServletResponse();

        trafficFilter.doFilter(request, response, new MockFilterChain());

        verifyNoInteractions(visitLogRepository);
    }

    @Test
    void visitorPingUsesContainerResolvedRemoteAddress() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/visitor/ping");
        request.setRemoteAddr("198.51.100.24");
        request.addHeader("User-Agent", "JUnit");
        request.addHeader("X-Forwarded-For", "203.0.113.10");
        MockHttpServletResponse response = new MockHttpServletResponse();

        trafficFilter.doFilter(request, response, new MockFilterChain());

        ArgumentCaptor<VisitLog> logCaptor = ArgumentCaptor.forClass(VisitLog.class);
        verify(visitLogRepository).save(logCaptor.capture());
        VisitLog log = logCaptor.getValue();
        assertEquals("/api/visitor/ping", log.getPath());
        assertEquals("GET", log.getMethod());
        assertEquals("198.51.100.24", log.getIp());
        assertEquals("JUnit", log.getUserAgent());
    }

    @Test
    void ascii请求头在边界内保留并在超限时截断() throws Exception {
        String exactUserAgent = "u".repeat(512);
        String exactReferer = "r".repeat(1024);

        VisitLog exactLog = captureVisitLog(exactUserAgent, exactReferer);
        assertEquals(exactUserAgent, exactLog.getUserAgent());
        assertEquals(exactReferer, exactLog.getReferer());

        VisitLog truncatedLog = captureVisitLog(exactUserAgent + "x", exactReferer + "x");
        assertEquals(exactUserAgent, truncatedLog.getUserAgent());
        assertEquals(exactReferer, truncatedLog.getReferer());
    }

    @Test
    void 补充平面字符按各自码点上限保留() throws Exception {
        String emoji = "😀";
        String exactUserAgent = emoji.repeat(512);
        String exactReferer = emoji.repeat(1024);

        VisitLog exactLog = captureVisitLog(exactUserAgent, exactReferer);
        assertEquals(exactUserAgent, exactLog.getUserAgent());
        assertEquals(exactReferer, exactLog.getReferer());

        VisitLog truncatedLog = captureVisitLog(emoji.repeat(513), emoji.repeat(1025));
        assertEquals(exactUserAgent, truncatedLog.getUserAgent());
        assertEquals(exactReferer, truncatedLog.getReferer());
        assertEquals(512, truncatedLog.getUserAgent().codePointCount(0, truncatedLog.getUserAgent().length()));
        assertEquals(1024, truncatedLog.getReferer().codePointCount(0, truncatedLog.getReferer().length()));
    }

    @Test
    void 超长请求路径按数据库码点上限截断() throws Exception {
        trafficFilter.doFilter(new MockHttpServletRequest("GET", "/api/" + "p".repeat(251)), new MockHttpServletResponse(), new MockFilterChain());
        ArgumentCaptor<VisitLog> logCaptor = ArgumentCaptor.forClass(VisitLog.class);
        verify(visitLogRepository).save(logCaptor.capture());
        assertEquals("/api/" + "p".repeat(250), logCaptor.getValue().getPath());
    }

    @Test
    void 截断不会将完整补充平面字符拆成孤立代理项() throws Exception {
        String emoji = "😀";
        String expectedUserAgent = "u".repeat(511) + emoji;
        String expectedReferer = "r".repeat(1023) + emoji;

        VisitLog log = captureVisitLog(expectedUserAgent + "x", expectedReferer + "x");

        assertEquals(expectedUserAgent, log.getUserAgent());
        assertEquals(expectedReferer, log.getReferer());
        assertFalse(Character.isHighSurrogate(log.getUserAgent().charAt(log.getUserAgent().length() - 1)));
        assertFalse(Character.isHighSurrogate(log.getReferer().charAt(log.getReferer().length() - 1)));
    }

    @Test
    void 缺失和空请求头保持原值() throws Exception {
        VisitLog missingLog = captureVisitLog(null, null);
        assertNull(missingLog.getUserAgent());
        assertNull(missingLog.getReferer());

        VisitLog emptyLog = captureVisitLog("", "");
        assertEquals("", emptyLog.getUserAgent());
        assertEquals("", emptyLog.getReferer());
    }

    @Test
    void persistenceFailureDoesNotInterruptRequest() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/visitor/ping");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();
        when(visitLogRepository.save(any(VisitLog.class)))
                .thenThrow(new RuntimeException("测试用持久化异常"));

        trafficFilter.doFilter(request, response, filterChain);

        assertSame(request, filterChain.getRequest());
    }

    private VisitLog captureVisitLog(String userAgent, String referer) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/visitor/ping");
        if (userAgent != null) {
            request.addHeader("User-Agent", userAgent);
        }
        if (referer != null) {
            request.addHeader("Referer", referer);
        }

        trafficFilter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        ArgumentCaptor<VisitLog> logCaptor = ArgumentCaptor.forClass(VisitLog.class);
        verify(visitLogRepository).save(logCaptor.capture());
        clearInvocations(visitLogRepository);
        return logCaptor.getValue();
    }
}
