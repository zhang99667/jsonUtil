package com.jsonhelper.backend.controller;

import com.jsonhelper.backend.common.exception.GlobalExceptionHandler;
import com.jsonhelper.backend.repository.ToolEventRepository;
import com.jsonhelper.backend.repository.VisitLogRepository;
import com.jsonhelper.backend.service.GeoService;
import com.jsonhelper.backend.service.ToolEventService;
import com.jsonhelper.backend.service.TrafficService;
import com.jsonhelper.backend.service.UserAgentClassifier;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.lang.reflect.Parameter;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TrafficControllerTest {

    @Mock
    private VisitLogRepository visitLogRepository;

    @Mock
    private ToolEventRepository toolEventRepository;

    @Mock
    private UserAgentClassifier userAgentClassifier;

    private LocalValidatorFactoryBean validator;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        TrafficService trafficService = new TrafficService(visitLogRepository, new GeoService(), userAgentClassifier);
        ToolEventService toolEventService = new ToolEventService(toolEventRepository);
        validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders
                .standaloneSetup(new TrafficController(trafficService, toolEventService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @AfterEach
    void tearDown() {
        validator.close();
    }

    static Stream<Arguments> invalidBoundedQueries() {
        return Stream.of(
                Arguments.of("/api/admin/traffic/overview", "days", "0"),
                Arguments.of("/api/admin/traffic/trend", "days", "366"),
                Arguments.of("/api/admin/traffic/top-ips", "limit", "0"),
                Arguments.of("/api/admin/traffic/referer-distribution", "limit", "101"),
                Arguments.of("/api/admin/traffic/tool-events", "limit", "101")
        );
    }

    @ParameterizedTest
    @MethodSource("invalidBoundedQueries")
    void invalidBoundedQueryReturnsBadRequest(String path, String parameter, String value) throws Exception {
        mockMvc.perform(get(path).param(parameter, value))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("请求参数不合法"));

        verifyNoInteractions(visitLogRepository, toolEventRepository);
    }

    @Test
    void nonNumericQueryReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/admin/traffic/overview").param("days", "不是数字"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("请求参数不合法"));

        verifyNoInteractions(visitLogRepository, toolEventRepository);
    }

    @Test
    void maximumAllowedValuesReachService() throws Exception {
        when(visitLogRepository.countByIpTopN(
                any(LocalDateTime.class),
                any(LocalDateTime.class),
                any(Pageable.class)
        )).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/traffic/top-ips")
                        .param("days", "365")
                        .param("limit", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        verify(visitLogRepository).countByIpTopN(
                any(LocalDateTime.class),
                any(LocalDateTime.class),
                any(Pageable.class)
        );
    }

    @Test
    void everyTrafficQueryParameterDeclaresStandardBounds() {
        List<Parameter> queryParameters = Arrays.stream(TrafficController.class.getDeclaredMethods())
                .filter(method -> method.isAnnotationPresent(GetMapping.class))
                .flatMap(method -> Arrays.stream(method.getParameters()))
                .filter(parameter -> parameter.isAnnotationPresent(RequestParam.class))
                .toList();

        assertEquals(18, queryParameters.size());
        for (Parameter parameter : queryParameters) {
            RequestParam requestParam = parameter.getAnnotation(RequestParam.class);
            String name = requestParam.name().isBlank() ? parameter.getName() : requestParam.name();
            Min min = parameter.getAnnotation(Min.class);
            Max max = parameter.getAnnotation(Max.class);

            assertTrue(name.equals("days") || name.equals("limit"), "存在未识别的查询参数: " + name);
            assertNotNull(min, name + " 缺少最小值约束");
            assertNotNull(max, name + " 缺少最大值约束");
            assertEquals(1L, min.value(), name + " 的最小值必须为 1");
            assertEquals(name.equals("days") ? 365L : 100L, max.value(), name + " 的最大值不符合约定");
        }
    }
}
