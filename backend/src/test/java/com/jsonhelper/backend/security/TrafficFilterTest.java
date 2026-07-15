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
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
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
    void persistenceFailureDoesNotInterruptRequest() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/visitor/ping");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();
        when(visitLogRepository.save(any(VisitLog.class)))
                .thenThrow(new RuntimeException("测试用持久化异常"));

        trafficFilter.doFilter(request, response, filterChain);

        assertSame(request, filterChain.getRequest());
    }
}
