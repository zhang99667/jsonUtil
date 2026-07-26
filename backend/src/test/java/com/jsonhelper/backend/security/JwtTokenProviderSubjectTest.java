package com.jsonhelper.backend.security;

import com.jsonhelper.backend.config.JwtProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtTokenProviderSubjectTest {

    private JwtTokenProvider provider;

    @BeforeEach
    void setUp() {
        provider = new JwtTokenProvider(new JwtProperties(
                "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789AB",
                Duration.ofDays(1)
        ));
        provider.init();
    }

    @Test
    void generateTokenUsesAuthenticationNameAsSubject() {
        var user = User.withUsername("admin-user").password("unused").roles("ADMIN").build();

        assertEquals("service-user", readGeneratedSubject(
                new UsernamePasswordAuthenticationToken("service-user", null)
        ));
        assertEquals("admin-user", readGeneratedSubject(
                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities())
        ));
    }

    @Test
    void generateTokenRejectsBlankAuthenticationName() {
        var authentication = new TestingAuthenticationToken("   ", null);

        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> provider.generateToken(authentication)
        );
        assertEquals("无法为缺少用户标识的认证信息签发 JWT", error.getMessage());
    }

    private String readGeneratedSubject(Authentication authentication) {
        return provider.getUserUsernameFromJWT(provider.generateToken(authentication));
    }
}
