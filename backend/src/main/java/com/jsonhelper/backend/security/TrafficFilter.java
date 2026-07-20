package com.jsonhelper.backend.security;

import com.jsonhelper.backend.entity.VisitLog;
import com.jsonhelper.backend.repository.VisitLogRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Slf4j
@RequiredArgsConstructor
public class TrafficFilter extends OncePerRequestFilter {

    private static final int PATH_MAX_CODE_POINTS = 255;
    private static final int USER_AGENT_MAX_CODE_POINTS = 512;
    private static final int REFERER_MAX_CODE_POINTS = 1024;

    private final VisitLogRepository visitLogRepository;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        if (shouldLogTraffic(path)) {
            try {
                VisitLog visitLog = new VisitLog();
                visitLog.setIp(request.getRemoteAddr());
                visitLog.setPath(truncateByCodePoints(path, PATH_MAX_CODE_POINTS));
                visitLog.setMethod(request.getMethod());
                visitLog.setUserAgent(truncateByCodePoints(request.getHeader("User-Agent"), USER_AGENT_MAX_CODE_POINTS));
                visitLog.setReferer(truncateByCodePoints(request.getHeader("Referer"), REFERER_MAX_CODE_POINTS));
                visitLogRepository.save(visitLog);
            } catch (Exception e) {
                // 流量统计是旁路能力，持久化失败不能阻断正常请求。
                log.warn("流量记录失败，请求继续处理，异常类型: {}", e.getClass().getSimpleName());
                log.debug("流量记录失败详情", e);
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean shouldLogTraffic(String path) {
        if (!isPathOrDescendant(path, "/api")) {
            return false;
        }

        // 管理接口、健康检查和工具事件都有独立用途，避免部署/监控请求抬高普通 PV。
        return !isPathOrDescendant(path, "/api/admin")
                && !isPathOrDescendant(path, "/api/stats")
                && !path.equals("/api/health")
                && !isPathOrDescendant(path, "/api/visitor/events");
    }

    private boolean isPathOrDescendant(String path, String prefix) {
        return path.equals(prefix) || path.startsWith(prefix + "/");
    }

    private String truncateByCodePoints(String value, int maxCodePoints) {
        if (value == null || value.codePointCount(0, value.length()) <= maxCodePoints) {
            return value;
        }
        return value.substring(0, value.offsetByCodePoints(0, maxCodePoints));
    }
}
