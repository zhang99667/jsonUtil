package com.jsonhelper.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private int jwtExpirationInMs;

    private Key key;

    @PostConstruct
    public void init() {
        if (jwtSecret == null || jwtSecret.isBlank() || jwtSecret.startsWith("change-me")) {
            throw new IllegalStateException("JWT_SECRET 未配置或仍为示例值，请配置至少 64 字节的随机密钥");
        }

        byte[] keyBytes = tryDecodeBase64Secret(jwtSecret);
        if (keyBytes != null) {
            this.key = Keys.hmacShaKeyFor(keyBytes);
            logger.info("JWT Key initialized successfully from Base64 secret (Size: {} bits)", keyBytes.length * 8);
            return;
        }

        byte[] literalKeyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        validateKeyLength(literalKeyBytes);
        this.key = Keys.hmacShaKeyFor(literalKeyBytes);
        logger.warn("JWT Secret is not valid Base64, using literal bytes (Size: {} bits)", literalKeyBytes.length * 8);
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
     * HS512 签名至少需要 512 bit 密钥，提前给出可读错误信息
     */
    private void validateKeyLength(byte[] keyBytes) {
        if (keyBytes.length < 64) {
            throw new IllegalStateException("JWT_SECRET 长度不足，HS512 至少需要 64 字节随机密钥");
        }
    }

    public String generateToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .setSubject(userPrincipal.getUsername())
                .setIssuedAt(new Date())
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

        return claims.getSubject();
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            logger.error("Invalid JWT token: {}", ex.getMessage());
        }
        return false;
    }
}
