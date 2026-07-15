package com.jsonhelper.backend.security;

import com.jsonhelper.backend.config.JwtProperties;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtTokenProviderTest {

    private static final String LONG_SECRET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789AB";

    @Test
    void initAcceptsLongLiteralSecret() {
        JwtTokenProvider provider = createProvider(LONG_SECRET);

        assertDoesNotThrow(provider::init);
    }

    @Test
    void initAcceptsLongBase64Secret() {
        String secret = Base64.getEncoder().encodeToString(new byte[64]);
        JwtTokenProvider provider = createProvider(secret);

        assertDoesNotThrow(provider::init);
    }

    @Test
    void initRejectsShortSecret() {
        JwtTokenProvider provider = createProvider("short-secret");

        assertThrows(IllegalStateException.class, provider::init);
    }

    @Test
    void initRejectsExampleSecret() {
        JwtTokenProvider provider = createProvider("change-me-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789AB");

        assertThrows(IllegalStateException.class, provider::init);
    }

    private JwtTokenProvider createProvider(String secret) {
        return new JwtTokenProvider(new JwtProperties(secret, Duration.ofDays(1)));
    }
}
