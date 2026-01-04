package com.jsonhelper.backend.common.exception;

import com.jsonhelper.backend.dto.response.Result;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public ResponseEntity<Result<String>> handleAuthenticationException(
            org.springframework.security.core.AuthenticationException e) {
        logger.error("Authentication Error: {}", e.getMessage());
        return ResponseEntity.status(401).body(Result.error(401, "用户名或密码错误"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Result<String>> handleException(Exception e) {
        logger.error("System Error", e);
        return ResponseEntity.status(500).body(Result.error(500, e.getMessage()));
    }

    // You can add more specific exception handlers here (e.g.
    // AuthenticationException)
}
