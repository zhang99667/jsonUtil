package com.jsonhelper.backend.security;

import com.jsonhelper.backend.config.JwtProperties;
import com.jsonhelper.backend.controller.AdminController;
import com.jsonhelper.backend.service.UserService;
import io.jsonwebtoken.MalformedJwtException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.web.cors.CorsConfigurationSource;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = AdminController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = TrafficFilter.class)
)
@Import({SecurityConfig.class, SecurityErrorResponseHandler.class, SecurityConfigMvcTest.TestConfig.class})
class SecurityConfigMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("无效令牌返回统一未认证响应")
    void invalidTokenReturnsUnifiedUnauthorizedResponse() throws Exception {
        ResultActions result = mockMvc.perform(get("/api/admin/users")
                .header("Authorization", "Bearer invalid-token"));

        expectErrorResponse(result, 401, "未认证或登录已失效");
    }

    @Test
    @DisplayName("未登录请求返回统一未认证响应")
    void anonymousRequestReturnsUnifiedUnauthorizedResponse() throws Exception {
        ResultActions result = mockMvc.perform(get("/api/admin/users"));

        expectErrorResponse(result, 401, "未认证或登录已失效");
    }

    @Test
    @WithMockUser(username = "普通用户", roles = "USER")
    @DisplayName("普通用户访问管理员接口返回统一无权限响应")
    void userRoleReturnsUnifiedForbiddenResponse() throws Exception {
        ResultActions result = mockMvc.perform(get("/api/admin/users"));

        expectErrorResponse(result, 403, "无权访问该资源");
    }

    private void expectErrorResponse(ResultActions result, int code, String message) throws Exception {
        result.andExpect(status().is(code))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(content().encoding(StandardCharsets.UTF_8))
                .andExpect(jsonPath("$.code").value(code))
                .andExpect(jsonPath("$.message").value(message))
                .andExpect(jsonPath("$.data").value(nullValue()));
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class TestConfig {

        @Bean
        UserService userService() {
            return new UserService(null, null);
        }

        @Bean
        CustomUserDetailsService customUserDetailsService() {
            return new CustomUserDetailsService(null);
        }

        @Bean
        JwtTokenProvider jwtTokenProvider() {
            return new RejectingJwtTokenProvider();
        }

        @Bean
        TrafficFilter trafficFilter() {
            return new TrafficFilter(null);
        }

        @Bean
        CorsConfigurationSource corsConfigurationSource() {
            return request -> null;
        }
    }

    private static final class RejectingJwtTokenProvider extends JwtTokenProvider {

        private RejectingJwtTokenProvider() {
            super(new JwtProperties("a".repeat(64), Duration.ofDays(1)));
        }

        @Override
        public String getUserUsernameFromJWT(String token) {
            throw new MalformedJwtException("测试用无效令牌");
        }
    }
}
