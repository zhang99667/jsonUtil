package com.jsonhelper.backend.security;

import com.jsonhelper.backend.entity.VisitLog;
import com.jsonhelper.backend.repository.VisitLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TrafficFilterPersistenceBoundaryTest {

    @Mock
    private VisitLogRepository visitLogRepository;

    private TrafficFilter trafficFilter;

    @BeforeEach
    void setUp() {
        trafficFilter = new TrafficFilter(visitLogRepository);
    }

    @Test
    void overlongRequestMetadataIsTruncatedToDatabaseColumnLimits() throws Exception {
        MockHttpServletRequest request = createRequest(
                VisitLog.IP_MAX_LENGTH + 1,
                VisitLog.PATH_MAX_LENGTH + 1,
                VisitLog.METHOD_MAX_LENGTH + 1,
                VisitLog.USER_AGENT_MAX_LENGTH + 1,
                VisitLog.REFERER_MAX_LENGTH + 1);
        request.removeHeader("User-Agent");
        request.addHeader("User-Agent", "😀".repeat(VisitLog.USER_AGENT_MAX_LENGTH + 1));

        VisitLog log = captureVisitLog(request);

        assertTruncated(log.getIp(), VisitLog.IP_MAX_LENGTH, "i");
        assertTruncated(log.getPath(), VisitLog.PATH_MAX_LENGTH, "/api/");
        assertTruncated(log.getMethod(), VisitLog.METHOD_MAX_LENGTH, "M");
        assertTruncated(log.getUserAgent(), VisitLog.USER_AGENT_MAX_LENGTH, "😀");
        assertEquals("😀".repeat(VisitLog.USER_AGENT_MAX_LENGTH), log.getUserAgent());
        assertTruncated(log.getReferer(), VisitLog.REFERER_MAX_LENGTH, "r");
    }

    @Test
    void valuesAtColumnLimitsRemainUnchanged() throws Exception {
        MockHttpServletRequest request = createRequest(
                VisitLog.IP_MAX_LENGTH,
                VisitLog.PATH_MAX_LENGTH,
                VisitLog.METHOD_MAX_LENGTH,
                VisitLog.USER_AGENT_MAX_LENGTH,
                VisitLog.REFERER_MAX_LENGTH);

        VisitLog log = captureVisitLog(request);

        assertEquals(request.getRemoteAddr(), log.getIp());
        assertEquals(request.getRequestURI(), log.getPath());
        assertEquals(request.getMethod(), log.getMethod());
        assertEquals(request.getHeader("User-Agent"), log.getUserAgent());
        assertEquals(request.getHeader("Referer"), log.getReferer());
    }

    @Test
    void persistenceFailureDoesNotInterruptRequest() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/visitor/ping");
        MockFilterChain filterChain = new MockFilterChain();
        when(visitLogRepository.save(any(VisitLog.class)))
                .thenThrow(new DataAccessResourceFailureException("测试用持久化异常"));

        trafficFilter.doFilter(request, new MockHttpServletResponse(), filterChain);

        assertSame(request, filterChain.getRequest());
    }

    @Test
    void programmingFailureIsNotSwallowed() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/visitor/ping");
        MockFilterChain filterChain = new MockFilterChain();
        IllegalStateException failure = new IllegalStateException("测试用编程异常");
        when(visitLogRepository.save(any(VisitLog.class))).thenThrow(failure);

        IllegalStateException thrown = assertThrows(
                IllegalStateException.class,
                () -> trafficFilter.doFilter(request, new MockHttpServletResponse(), filterChain)
        );

        assertSame(failure, thrown);
        assertNull(filterChain.getRequest());
    }

    private MockHttpServletRequest createRequest(int ipLength, int pathLength, int methodLength,
            int userAgentLength, int refererLength) {
        String path = "/api/" + "p".repeat(pathLength - 5);
        MockHttpServletRequest request = new MockHttpServletRequest("M".repeat(methodLength), path);
        request.setRemoteAddr("i".repeat(ipLength));
        request.addHeader("User-Agent", "u".repeat(userAgentLength));
        request.addHeader("Referer", "r".repeat(refererLength));
        return request;
    }

    private VisitLog captureVisitLog(MockHttpServletRequest request) throws Exception {
        trafficFilter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
        ArgumentCaptor<VisitLog> logCaptor = ArgumentCaptor.forClass(VisitLog.class);
        verify(visitLogRepository).save(logCaptor.capture());
        return logCaptor.getValue();
    }

    private void assertTruncated(String value, int expectedLength, String expectedPrefix) {
        assertEquals(expectedLength, value.codePointCount(0, value.length()));
        assertTrue(value.startsWith(expectedPrefix));
    }
}
