package com.jsonhelper.backend.common.exception;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.jsonhelper.backend.dto.response.Result;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.server.MethodNotAllowedException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void genericExceptionDoesNotExposeInternalMessage() {
        ResponseEntity<Result<String>> response = handler.handleException(
                new RuntimeException("数据库口令不应出现在响应中")
        );

        Result<String> body = response.getBody();
        assertEquals(500, response.getStatusCode().value());
        assertNotNull(body);
        assertEquals(500, body.getCode());
        assertEquals("服务器内部错误", body.getMessage());
    }

    @Test
    void blankIllegalArgumentUsesStableFallbackMessage() {
        ResponseEntity<Result<String>> response = handler.handleIllegalArgumentException(
                new IllegalArgumentException("内部路径不应出现在响应中")
        );

        Result<String> body = response.getBody();
        assertEquals(400, response.getStatusCode().value());
        assertNotNull(body);
        assertEquals(400, body.getCode());
        assertEquals("请求参数不合法", body.getMessage());
    }

    @Test
    void explicitClientErrorKeepsSafeBusinessMessage() {
        ResponseEntity<Object> response = dispatchFrameworkException(
                new ResponseStatusException(HttpStatus.CONFLICT, "用户名已被占用")
        );

        Result<?> body = (Result<?>) response.getBody();
        assertEquals(409, response.getStatusCode().value());
        assertNotNull(body);
        assertEquals(409, body.getCode());
        assertEquals("用户名已被占用", body.getMessage());
    }

    @Test
    void responseStatusSubclassReasonUsesStableFallback() {
        ResponseEntity<Object> response = dispatchFrameworkException(
                new ResponseStatusException(HttpStatus.BAD_REQUEST, "Validation failure") { });

        assertEquals("请求参数不合法", ((Result<?>) response.getBody()).getMessage());
    }

    @Test
    void responseStatusExceptionKeepsSemanticHeaders() {
        ResponseEntity<Object> response = dispatchFrameworkException(
                new MethodNotAllowedException(HttpMethod.POST, Set.of(HttpMethod.GET))
        );

        assertEquals(405, response.getStatusCode().value());
        assertEquals(Set.of(HttpMethod.GET), response.getHeaders().getAllow());
    }

    @Test
    void committedServletResponseDoesNotCreateSecondResponse() {
        MockHttpServletResponse response = new MockHttpServletResponse();
        response.setCommitted(true);

        assertNull(handler.handleExceptionInternal(
                new Exception("响应已提交"), null, new HttpHeaders(), HttpStatus.INTERNAL_SERVER_ERROR,
                new ServletWebRequest(new MockHttpServletRequest(), response)));
    }

    @Test
    void validationAndAuthenticationLogsDoNotExposeExceptionMessages() {
        String sensitiveValue = "raw-secret-password";

        HttpMessageNotReadableException validationError = new HttpMessageNotReadableException(
                "rejected value [" + sensitiveValue + "]"
        );
        CapturedLogs<ResponseEntity<Object>> validation = captureLogs(
                () -> handler.handleExceptionInternal(
                        validationError,
                        null,
                        new HttpHeaders(),
                        HttpStatus.BAD_REQUEST,
                        new ServletWebRequest(new MockHttpServletRequest())
                )
        );
        CapturedLogs<ResponseEntity<Result<String>>> authentication = captureLogs(
                () -> handler.handleAuthenticationException(
                        new BadCredentialsException("bad credentials: " + sensitiveValue)
                )
        );

        assertEquals(400, validation.result().getStatusCode().value());
        assertEquals(401, authentication.result().getStatusCode().value());
        assertFalse(validation.events().isEmpty());
        assertFalse(authentication.events().isEmpty());
        assertTrue(validation.events().stream()
                .allMatch(event -> !event.getFormattedMessage().contains(sensitiveValue)));
        assertTrue(authentication.events().stream()
                .allMatch(event -> !event.getFormattedMessage().contains(sensitiveValue)));
        assertTrue(validation.events().stream()
                .allMatch(event -> event.getThrowableProxy() == null));
        assertTrue(authentication.events().stream()
                .allMatch(event -> event.getThrowableProxy() == null));
    }

    @Test
    void serverResponseStatusKeepsCauseInErrorLog() {
        RuntimeException cause = new RuntimeException("上游故障详情");
        CapturedLogs<ResponseEntity<Object>> captured = captureLogs(
                () -> dispatchFrameworkException(
                        new ResponseStatusException(HttpStatus.BAD_GATEWAY, "上游服务失败", cause)
                )
        );

        Result<?> body = (Result<?>) captured.result().getBody();
        assertEquals(502, captured.result().getStatusCode().value());
        assertNotNull(body);
        assertEquals("服务器内部错误", body.getMessage());
        assertFalse(captured.events().isEmpty());
        ILoggingEvent event = captured.events().get(captured.events().size() - 1);
        assertEquals(Level.ERROR, event.getLevel());
        assertNotNull(event.getThrowableProxy());
    }

    private <T> CapturedLogs<T> captureLogs(Supplier<T> action) {
        Logger logger = (Logger) LoggerFactory.getLogger(GlobalExceptionHandler.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        try {
            return new CapturedLogs<>(action.get(), List.copyOf(appender.list));
        } finally {
            logger.detachAppender(appender);
            appender.stop();
        }
    }

    private ResponseEntity<Object> dispatchFrameworkException(Exception exception) {
        try {
            return handler.handleException(
                    exception,
                    new ServletWebRequest(new MockHttpServletRequest())
            );
        } catch (Exception unexpected) {
            throw new AssertionError(unexpected);
        }
    }

    private record CapturedLogs<T>(T result, List<ILoggingEvent> events) {
    }
}
