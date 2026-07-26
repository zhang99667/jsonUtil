package com.jsonhelper.backend.controller;

import com.jsonhelper.backend.dto.response.DailyTrendDTO;
import com.jsonhelper.backend.dto.response.DeviceStatsDTO;
import com.jsonhelper.backend.dto.response.GeoStatsDTO;
import com.jsonhelper.backend.dto.response.HourlyStatsDTO;
import com.jsonhelper.backend.dto.response.IpStatsDTO;
import com.jsonhelper.backend.dto.response.PathStatsDTO;
import com.jsonhelper.backend.dto.response.RefererStatsDTO;
import com.jsonhelper.backend.dto.response.Result;
import com.jsonhelper.backend.dto.response.SessionStatsDTO;
import com.jsonhelper.backend.dto.response.ToolEventStatsDTO;
import com.jsonhelper.backend.dto.response.TrafficOverviewDTO;
import com.jsonhelper.backend.service.ToolEventService;
import com.jsonhelper.backend.service.TrafficService;
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
        return Result.success(trafficService.getOverview(days));
    }

    @GetMapping("/trend")
    public Result<List<DailyTrendDTO>> getDailyTrend(
            @RequestParam(name = "days", defaultValue = "30")
            @Min(value = MIN_QUERY_VALUE, message = "统计天数不能小于 1")
            @Max(value = MAX_STATISTICS_DAYS, message = "统计天数不能超过 365")
            int days) {
        return Result.success(trafficService.getDailyTrend(days));
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
        return Result.success(trafficService.getTopIps(days, limit));
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
        return Result.success(trafficService.getTopPaths(days, limit));
    }

    @GetMapping("/hourly")
    public Result<List<HourlyStatsDTO>> getHourlyDistribution(
            @RequestParam(name = "days", defaultValue = "7")
            @Min(value = MIN_QUERY_VALUE, message = "统计天数不能小于 1")
            @Max(value = MAX_STATISTICS_DAYS, message = "统计天数不能超过 365")
            int days) {
        return Result.success(trafficService.getHourlyDistribution(days));
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
        return Result.success(trafficService.getGeoDistribution(days, limit));
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
        return Result.success(trafficService.getDeviceDistribution(days, limit));
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
        return Result.success(trafficService.getBrowserDistribution(days, limit));
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
        return Result.success(trafficService.getRefererDistribution(days, limit));
    }

    @GetMapping("/session-duration")
    public Result<List<SessionStatsDTO>> getSessionDuration(
            @RequestParam(name = "days", defaultValue = "7")
            @Min(value = MIN_QUERY_VALUE, message = "统计天数不能小于 1")
            @Max(value = MAX_STATISTICS_DAYS, message = "统计天数不能超过 365")
            int days) {
        return Result.success(trafficService.getSessionDurationStats(days));
    }

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
        return Result.success(toolEventService.getStats(days, limit));
    }
}
