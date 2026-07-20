package com.jsonhelper.backend.security;

import com.jsonhelper.backend.entity.VisitLog;
import com.jsonhelper.backend.repository.VisitLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.stream.Stream;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class TrafficFilterPathTest {

    @Mock
    private VisitLogRepository visitLogRepository;

    private TrafficFilter trafficFilter;

    @BeforeEach
    void setUp() {
        trafficFilter = new TrafficFilter(visitLogRepository);
    }

    @ParameterizedTest
    @MethodSource("pathCases")
    void 仅按完整路径段决定是否记录(String path, boolean shouldLog) throws Exception {
        trafficFilter.doFilter(new MockHttpServletRequest("GET", path),
                new MockHttpServletResponse(), new MockFilterChain());

        if (shouldLog) {
            verify(visitLogRepository).save(any(VisitLog.class));
        } else {
            verifyNoInteractions(visitLogRepository);
        }
    }

    private static Stream<Arguments> pathCases() {
        return Stream.of(
                Arguments.of("/api", true),
                Arguments.of("/apiary", false),
                Arguments.of("/api/administer", true),
                Arguments.of("/api/stats-export", true),
                Arguments.of("/api/visitor/events-v2", true),
                Arguments.of("/api/admin/users", false),
                Arguments.of("/api/stats", false),
                Arguments.of("/api/visitor/events", false),
                Arguments.of("/api/visitor/events/batch", false)
        );
    }
}
