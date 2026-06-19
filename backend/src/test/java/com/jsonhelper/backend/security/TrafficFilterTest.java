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
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class TrafficFilterTest {

    @Mock
    private VisitLogRepository visitLogRepository;

    private TrafficFilter trafficFilter;

    @BeforeEach
    void setUp() {
        trafficFilter = new TrafficFilter();
        ReflectionTestUtils.setField(trafficFilter, "visitLogRepository", visitLogRepository);
    }

    @Test
    void healthCheckDoesNotPersistVisitLog() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/health");
        MockHttpServletResponse response = new MockHttpServletResponse();

        trafficFilter.doFilter(request, response, new MockFilterChain());

        verifyNoInteractions(visitLogRepository);
    }

    @Test
    void visitorPingStillPersistsVisitLog() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/visitor/ping");
        request.addHeader("User-Agent", "JUnit");
        request.addHeader("X-Forwarded-For", "203.0.113.10, 10.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();

        trafficFilter.doFilter(request, response, new MockFilterChain());

        ArgumentCaptor<VisitLog> logCaptor = ArgumentCaptor.forClass(VisitLog.class);
        verify(visitLogRepository).save(logCaptor.capture());
        VisitLog log = logCaptor.getValue();
        assertEquals("/api/visitor/ping", log.getPath());
        assertEquals("GET", log.getMethod());
        assertEquals("203.0.113.10", log.getIp());
        assertEquals("JUnit", log.getUserAgent());
    }
}
