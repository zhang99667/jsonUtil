package com.jsonhelper.backend.controller;

import com.jsonhelper.backend.dto.response.*;
import com.jsonhelper.backend.service.TrafficService;
import com.jsonhelper.backend.service.ToolEventService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/traffic")
@RequiredArgsConstructor
public class TrafficController {

    private static final int MIN_QUERY_VALUE = 1;
    private static final int MAX_STATISTICS_DAYS = 365;
    private static final int MAX_RESULT_LIMIT = 100;

    private final TrafficService trafficService;
    private final ToolEventService toolEventService;

    @GetMapping("/overview")
    public Result<TrafficOverviewDTO> getOverview(
            @RequestParam(name = "days", defaultValue = "7")
            @Min(value = MIN_QUERY_VALUE, message = "统计天数不能小于 1")
            @Max(value = MAX_STATISTICS_DAYS, message = "统计天数不能超过 365")
            int days) {
        TrafficOverviewDTO overview = trafficService.getOverview(days);
        return Result.success(overview);
    }

    @GetMapping("/trend")
    public Result<List<DailyTrendDTO>> getDailyTrend(
            @RequestParam(name = "days", defaultValue = "30")
            @Min(value = MIN_QUERY_VALUE, message = "统计天数不能小于 1")
            @Max(value = MAX_STATISTICS_DAYS, message = "统计天数不能超过 365")
            int days) {
        List<DailyTrendDTO> trend = trafficService.getDailyTrend(days);
        return Result.success(trend);
    }

    @GetMapping("/top-ips")
    public Result<List<IpStatsDTO>> getTopIps(
            @RequestParam(name = "days", defaultValue = "7")
            @Min(value = MIN_QUERY_VALUE, message = "统计天数不能小于 1")
            @Max(value = MAX_STATISTICS_DAYS, message = "统计天数不能超过 365")
            int days,
            @RequestParam(name = "limit", defaultValue = "10")
            @Min(value = MIN_QUERY_VALUE, message = "返回条数不能小于 1")
            @Max(value = MAX_RESULT_LIMIT, message = "返回条数不能超过 100")
            int limit) {
        List<IpStatsDTO> topIps = trafficService.getTopIps(days, limit);
        return Result.success(topIps);
    }

    @GetMapping("/top-paths")
    public Result<List<PathStatsDTO>> getTopPaths(
            @RequestParam(name = "days", defaultValue = "7")
            @Min(value = MIN_QUERY_VALUE, message = "统计天数不能小于 1")
            @Max(value = MAX_STATISTICS_DAYS, message = "统计天数不能超过 365")
            int days,
            @RequestParam(name = "limit", defaultValue = "10")
            @Min(value = MIN_QUERY_VALUE, message = "返回条数不能小于 1")
            @Max(value = MAX_RESULT_LIMIT, message = "返回条数不能超过 100")
            int limit) {
        List<PathStatsDTO> topPaths = trafficService.getTopPaths(days, limit);
        return Result.success(topPaths);
    }

    /**
     * 获取时段分布（24小时）
     * @param days 统计天数，默认7天
     */
    @GetMapping("/hourly")
    public Result<List<HourlyStatsDTO>> getHourlyDistribution(
            @RequestParam(name = "days", defaultValue = "7")
            @Min(value = MIN_QUERY_VALUE, message = "统计天数不能小于 1")
            @Max(value = MAX_STATISTICS_DAYS, message = "统计天数不能超过 365")
            int days) {
        List<HourlyStatsDTO> hourly = trafficService.getHourlyDistribution(days);
        return Result.success(hourly);
    }

    @GetMapping("/geo-distribution")
    public Result<List<GeoStatsDTO>> getGeoDistribution(
            @RequestParam(name = "days", defaultValue = "7")
            @Min(value = MIN_QUERY_VALUE, message = "统计天数不能小于 1")
            @Max(value = MAX_STATISTICS_DAYS, message = "统计天数不能超过 365")
            int days,
            @RequestParam(name = "limit", defaultValue = "15")
            @Min(value = MIN_QUERY_VALUE, message = "返回条数不能小于 1")
            @Max(value = MAX_RESULT_LIMIT, message = "返回条数不能超过 100")
            int limit) {
        List<GeoStatsDTO> geoStats = trafficService.getGeoDistribution(days, limit);
        return Result.success(geoStats);
    }

    @GetMapping("/device-distribution")
    public Result<List<DeviceStatsDTO>> getDeviceDistribution(
            @RequestParam(name = "days", defaultValue = "7")
            @Min(value = MIN_QUERY_VALUE, message = "统计天数不能小于 1")
            @Max(value = MAX_STATISTICS_DAYS, message = "统计天数不能超过 365")
            int days,
            @RequestParam(name = "limit", defaultValue = "10")
            @Min(value = MIN_QUERY_VALUE, message = "返回条数不能小于 1")
            @Max(value = MAX_RESULT_LIMIT, message = "返回条数不能超过 100")
            int limit) {
        List<DeviceStatsDTO> deviceStats = trafficService.getDeviceDistribution(days, limit);
        return Result.success(deviceStats);
    }

    @GetMapping("/browser-distribution")
    public Result<List<DeviceStatsDTO>> getBrowserDistribution(
            @RequestParam(name = "days", defaultValue = "7")
            @Min(value = MIN_QUERY_VALUE, message = "统计天数不能小于 1")
            @Max(value = MAX_STATISTICS_DAYS, message = "统计天数不能超过 365")
            int days,
            @RequestParam(name = "limit", defaultValue = "10")
            @Min(value = MIN_QUERY_VALUE, message = "返回条数不能小于 1")
            @Max(value = MAX_RESULT_LIMIT, message = "返回条数不能超过 100")
            int limit) {
        List<DeviceStatsDTO> browserStats = trafficService.getBrowserDistribution(days, limit);
        return Result.success(browserStats);
    }

    @GetMapping("/referer-distribution")
    public Result<List<RefererStatsDTO>> getRefererDistribution(
            @RequestParam(name = "days", defaultValue = "7")
            @Min(value = MIN_QUERY_VALUE, message = "统计天数不能小于 1")
            @Max(value = MAX_STATISTICS_DAYS, message = "统计天数不能超过 365")
            int days,
            @RequestParam(name = "limit", defaultValue = "10")
            @Min(value = MIN_QUERY_VALUE, message = "返回条数不能小于 1")
            @Max(value = MAX_RESULT_LIMIT, message = "返回条数不能超过 100")
            int limit) {
        List<RefererStatsDTO> refererStats = trafficService.getRefererDistribution(days, limit);
        return Result.success(refererStats);
    }

    @GetMapping("/session-duration")
    public Result<List<SessionStatsDTO>> getSessionDuration(
            @RequestParam(name = "days", defaultValue = "7")
            @Min(value = MIN_QUERY_VALUE, message = "统计天数不能小于 1")
            @Max(value = MAX_STATISTICS_DAYS, message = "统计天数不能超过 365")
            int days) {
        List<SessionStatsDTO> sessionStats = trafficService.getSessionDurationStats(days);
        return Result.success(sessionStats);
    }

    /**
     * 获取工具使用事件统计
     * @param days 统计天数，默认7天
     * @param limit 高频功能返回条数，默认10条
     */
    @GetMapping("/tool-events")
    public Result<ToolEventStatsDTO> getToolEvents(
            @RequestParam(name = "days", defaultValue = "7")
            @Min(value = MIN_QUERY_VALUE, message = "统计天数不能小于 1")
            @Max(value = MAX_STATISTICS_DAYS, message = "统计天数不能超过 365")
            int days,
            @RequestParam(name = "limit", defaultValue = "10")
            @Min(value = MIN_QUERY_VALUE, message = "返回条数不能小于 1")
            @Max(value = MAX_RESULT_LIMIT, message = "返回条数不能超过 100")
            int limit) {
        ToolEventStatsDTO stats = toolEventService.getStats(days, limit);
        return Result.success(stats);
    }
}
