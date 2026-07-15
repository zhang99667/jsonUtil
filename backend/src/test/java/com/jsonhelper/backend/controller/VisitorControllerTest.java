package com.jsonhelper.backend.controller;

import com.jsonhelper.backend.config.StrictJsonConfig;
import com.jsonhelper.backend.dto.ToolEventRequest;
import com.jsonhelper.backend.security.TrafficFilter;
import com.jsonhelper.backend.service.ToolEventService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = VisitorController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = TrafficFilter.class)
)
@AutoConfigureMockMvc(addFilters = false)
@Import({StrictJsonConfig.class, VisitorControllerTest.TestConfig.class})
class VisitorControllerTest {

    private static final String VALID_PAYLOAD = """
            {"eventName":"AI_FIX","category":"ai","status":"error","inputSizeBucket":"10_50kb","durationBucket":"100_500ms","source":"web"}
            """;

    @Autowired
    private RecordingToolEventService toolEventService;

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        toolEventService.recordedRequest = null;
    }

    static Stream<Arguments> invalidPayloads() {
        return Stream.of(
                Arguments.of("空对象", "{}"),
                Arguments.of("空请求", "null"),
                Arguments.of("空白事件", VALID_PAYLOAD.replace("AI_FIX", "   ")),
                Arguments.of("超长事件", VALID_PAYLOAD.replace("AI_FIX", "A".repeat(65))),
                Arguments.of("非法事件字符", VALID_PAYLOAD.replace("AI_FIX", "AI FIX")),
                Arguments.of("非法状态", VALID_PAYLOAD.replace("\"error\"", "\"failed\"")),
                Arguments.of("非法输入分桶", VALID_PAYLOAD.replace("\"10_50kb\"", "\"large\"")),
                Arguments.of("非法耗时分桶", VALID_PAYLOAD.replace("\"100_500ms\"", "\"slow\"")),
                Arguments.of("非法来源字符", VALID_PAYLOAD.replace("\"web\"", "\"web/main\"")),
                Arguments.of("未知敏感字段", VALID_PAYLOAD.replace("}", ",\"rawJson\":\"secret\"}")),
                Arguments.of("事件名称类型错误", VALID_PAYLOAD.replace("\"AI_FIX\"", "123"))
        );
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("invalidPayloads")
    void invalidToolEventReturnsBadRequestBeforeService(String ignoredLabel, String payload) throws Exception {
        mockMvc.perform(post("/api/visitor/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("请求参数不合法"));

        assertNull(toolEventService.recordedRequest);
    }

    @Test
    void validToolEventReachesService() throws Exception {
        mockMvc.perform(post("/api/visitor/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_PAYLOAD))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        assertNotNull(toolEventService.recordedRequest);
    }

    private static final class RecordingToolEventService extends ToolEventService {
        private ToolEventRequest recordedRequest;

        private RecordingToolEventService() {
            super(null);
        }

        @Override
        public void recordEvent(ToolEventRequest request) {
            recordedRequest = request;
        }
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class TestConfig {

        @Bean
        RecordingToolEventService recordingToolEventService() {
            return new RecordingToolEventService();
        }
    }
}
