package com.jsonhelper.backend.common.exception;

import com.jsonhelper.backend.dto.response.Result;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(Exception.class)
    public Result<String> handleException(Exception e) {
        logger.error("System Error", e);
        return Result.error(500, e.getMessage());
    }
    
    // You can add more specific exception handlers here (e.g. AuthenticationException)
}
