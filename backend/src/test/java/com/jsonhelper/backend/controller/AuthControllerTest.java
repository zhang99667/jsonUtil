package com.jsonhelper.backend.controller;

import com.jsonhelper.backend.common.exception.GlobalExceptionHandler;
import com.jsonhelper.backend.dto.JwtResponse;
import com.jsonhelper.backend.dto.LoginRequest;
import com.jsonhelper.backend.service.AuthService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerTest {

    private StubAuthService authService;
    private LocalValidatorFactoryBean validator;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        authService = new StubAuthService();
        validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders
                .standaloneSetup(new AuthController(authService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @AfterEach
    void tearDown() {
        validator.close();
    }

    static Stream<String> invalidLoginBodies() {
        String oversizedValue = "a".repeat(256);
        return Stream.of(
                "{}",
                "{\"username\":\"   \",\"password\":\"secret\"}",
                "{\"username\":\"admin\",\"password\":\"   \"}",
                "{\"username\":\"%s\",\"password\":\"secret\"}".formatted(oversizedValue),
                "{\"username\":\"admin\",\"password\":\"%s\"}".formatted(oversizedValue)
        );
    }

    @ParameterizedTest
    @MethodSource("invalidLoginBodies")
    void invalidLoginBodyReturnsBadRequestBeforeAuthentication(String requestBody) throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("请求参数不合法"));

        assertEquals(0, authService.loginCallCount);
    }

    @Test
    void validLoginBodyReachesAuthenticationService() throws Exception {
        authService.response = new JwtResponse("有效令牌");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"secret\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("有效令牌"));

        assertEquals(1, authService.loginCallCount);
    }

    private static final class StubAuthService extends AuthService {
        private JwtResponse response;
        private int loginCallCount;

        StubAuthService() {
            super(null, null);
        }

        @Override
        public JwtResponse login(LoginRequest loginRequest) {
            loginCallCount += 1;
            return response;
        }
    }
}
