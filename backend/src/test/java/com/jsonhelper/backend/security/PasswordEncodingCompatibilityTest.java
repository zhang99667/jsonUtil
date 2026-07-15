package com.jsonhelper.backend.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordEncodingCompatibilityTest {

    private final PasswordEncoder passwordEncoder = new SecurityConfig(null, null, null).passwordEncoder();

    @Test
    void newPasswordEncodingKeepsContentBeyondBcryptByteBoundary() {
        String commonPrefix = "a".repeat(72);
        String originalPassword = commonPrefix + "原始后缀";
        String differentPassword = commonPrefix + "不同后缀";

        String encoded = passwordEncoder.encode(originalPassword);

        assertTrue(passwordEncoder.matches(originalPassword, encoded));
        assertFalse(passwordEncoder.matches(differentPassword, encoded));
        assertTrue(encoded.startsWith("{pbkdf2@SpringSecurity_v5_8}"));
        assertTrue(encoded.length() <= 255);
    }

    @Test
    void legacyUnprefixedBcryptHashRemainsVerifiable() {
        String password = "历史账号密码";
        String legacyHash = new BCryptPasswordEncoder().encode(password);

        assertTrue(passwordEncoder.matches(password, legacyHash));
        assertFalse(passwordEncoder.matches("错误密码", legacyHash));
    }
}
