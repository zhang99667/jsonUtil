package com.jsonhelper.backend.common.exception;

import com.jsonhelper.backend.dto.response.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public ResponseEntity<Result<String>> handleAuthenticationException(
            org.springframework.security.core.AuthenticationException e) {
        log.warn("用户认证失败: {}", e.getClass().getSimpleName());
        return ResponseEntity.status(401).body(Result.error(401, "用户名或密码错误"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Result<String>> handleIllegalArgumentException(IllegalArgumentException e) {
        log.warn("请求参数不合法: {}", e.getClass().getSimpleName());
        return ResponseEntity.badRequest().body(Result.error(400, "请求参数不合法"));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Result<String>> handleDataIntegrityViolationException(
            DataIntegrityViolationException e) {
        log.warn("数据完整性约束冲突: {}", e.getClass().getSimpleName());
        return ResponseEntity.status(409).body(Result.error(409, "数据冲突，请检查后重试"));
    }

    @Override
    protected ResponseEntity<Object> handleExceptionInternal(
            Exception e,
            Object body,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {
        String message = resolveFrameworkErrorMessage(e, status);
        ResponseEntity<Object> response = super.handleExceptionInternal(
                e,
                Result.error(status.value(), message),
                headers,
                status,
                request
        );
        if (response == null) {
            return null;
        }
        if (status.is5xxServerError()) {
            log.error("框架请求处理失败，状态码 {}", status.value(), e);
        } else {
            log.warn("框架请求处理失败，状态码 {}: {}", status.value(), e.getClass().getSimpleName());
        }
        return response;
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Result<String>> handleException(Exception e) {
        log.error("服务器内部错误", e);
        return ResponseEntity.status(500).body(Result.error(500, "服务器内部错误"));
    }

    private String resolveFrameworkErrorMessage(Exception e, HttpStatusCode status) {
        if (e instanceof MaxUploadSizeExceededException) {
            return "上传文件超过大小限制";
        }
        if (status.value() == 405) {
            return "请求方式不支持";
        }
        if (status.value() == 415) {
            return "请求媒体类型不支持";
        }
        if (e instanceof ResponseStatusException responseStatusException
                && responseStatusException.getClass() == ResponseStatusException.class
                && status.is4xxClientError()
                && StringUtils.hasText(responseStatusException.getReason())) {
            return responseStatusException.getReason();
        }
        return status.is4xxClientError() ? "请求参数不合法" : "服务器内部错误";
    }
}
