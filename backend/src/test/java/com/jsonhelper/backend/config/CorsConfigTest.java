package com.jsonhelper.backend.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CorsConfigTest {

    @Test
    void apiRoutesUseTheCompleteCorsContract() {
        CorsConfigurationSource source = new CorsConfig().corsConfigurationSource();
        CorsConfiguration configuration = source.getCorsConfiguration(
                new MockHttpServletRequest("OPTIONS", "/api/files")
        );

        assertNotNull(configuration);
        assertEquals(List.of(
                "http://localhost",
                "http://localhost:80",
                "http://localhost:5173",
                "https://jsonutils.markz.fun",
                "https://markz.fun",
                "https://www.markz.fun",
                "https://admin.markz.fun"
        ), configuration.getAllowedOrigins());
        assertEquals(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"),
                configuration.getAllowedMethods());
        assertEquals(List.of(
                "Authorization",
                "Content-Type",
                "X-Requested-With",
                "Accept",
                "Origin",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"
        ), configuration.getAllowedHeaders());
        assertEquals(List.of("Authorization"), configuration.getExposedHeaders());
        assertTrue(configuration.getAllowCredentials());
        assertEquals(3600L, configuration.getMaxAge());
    }

    @Test
    void nonApiRoutesDoNotReceiveCorsConfiguration() {
        CorsConfigurationSource source = new CorsConfig().corsConfigurationSource();

        assertNull(source.getCorsConfiguration(new MockHttpServletRequest("GET", "/actuator/health")));
    }
}
