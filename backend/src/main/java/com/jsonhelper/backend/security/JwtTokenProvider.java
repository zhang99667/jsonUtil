package com.jsonhelper.backend.security;

import com.jsonhelper.backend.config.JwtProperties;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;

@Component
@Slf4j
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final JwtProperties jwtProperties;

    private Key key;

    @PostConstruct
    public void init() {
        String jwtSecret = jwtProperties.getSecret();
        if (jwtSecret == null || jwtSecret.isBlank() || jwtSecret.startsWith("change-me")) {
            throw new IllegalStateException("JWT_SECRET 未配置或仍为示例值，请配置至少 64 字节的随机密钥");
        }

        byte[] keyBytes = tryDecodeBase64Secret(jwtSecret);
        if (keyBytes != null) {
            this.key = Keys.hmacShaKeyFor(keyBytes);
            log.info("已使用 Base64 密钥初始化 JWT 签名，长度为 {} 位", keyBytes.length * 8);
            return;
        }

        byte[] literalKeyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        validateKeyLength(literalKeyBytes);
        this.key = Keys.hmacShaKeyFor(literalKeyBytes);
        log.warn("JWT 密钥不是有效的 Base64，改用原始字节，长度为 {} 位", literalKeyBytes.length * 8);
    }

    /**
     * 仅当 Base64 解码后满足 HS512 长度要求时采用解码结果，否则交给明文密钥兜底
     */
    private byte[] tryDecodeBase64Secret(String secret) {
        try {
            byte[] decoded = Base64.getDecoder().decode(secret);
            return decoded.length >= 64 ? decoded : null;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /**
     * HS512 签名至少需要 512 位密钥，提前给出可读错误信息
     */
    private void validateKeyLength(byte[] keyBytes) {
        if (keyBytes.length < 64) {
            throw new IllegalStateException("JWT_SECRET 长度不足，HS512 至少需要 64 字节随机密钥");
        }
    }

    public String generateToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();

        Instant now = Instant.now();
        Date issuedAt = Date.from(now);
        Date expiryDate = Date.from(now.plus(jwtProperties.getExpiration()));

        return Jwts.builder()
                .setSubject(userPrincipal.getUsername())
                .setIssuedAt(issuedAt)
                .setExpiration(expiryDate)
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();
    }

    public String getUserUsernameFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();

        String subject = claims.getSubject();
        if (subject == null || subject.isBlank()) {
            throw new MalformedJwtException("JWT 缺少用户标识");
        }
        return subject;
    }
}
