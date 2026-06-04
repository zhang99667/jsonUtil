package com.jsonhelper.backend.security;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtTokenProviderTest {

    @Test
    void initAcceptsLongLiteralSecret() {
        JwtTokenProvider provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret", "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789AB");
        ReflectionTestUtils.setField(provider, "jwtExpirationInMs", 86400000);

        assertDoesNotThrow(provider::init);
    }

    @Test
    void initRejectsShortSecret() {
        JwtTokenProvider provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret", "short-secret");
        ReflectionTestUtils.setField(provider, "jwtExpirationInMs", 86400000);

        assertThrows(IllegalStateException.class, provider::init);
    }
}
