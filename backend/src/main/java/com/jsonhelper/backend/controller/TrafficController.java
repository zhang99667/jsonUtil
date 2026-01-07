package com.jsonhelper.backend.controller;

import com.jsonhelper.backend.dto.response.*;
import com.jsonhelper.backend.service.TrafficService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/traffic")
@RequiredArgsConstructor
public class TrafficController {

    private final TrafficService trafficService;

    /**
     * 获取流量概览数据
     * @param days 统计天数，默认7天
     */
    @GetMapping("/overview")
    public Result<TrafficOverviewDTO> getOverview(
            @RequestParam(defaultValue = "7") int days) {
        TrafficOverviewDTO overview = trafficService.getOverview(days);
        return Result.success(overview);
    }

    /**
     * 获取每日趋势数据
     * @param days 统计天数，默认30天
     */
    @GetMapping("/trend")
    public Result<List<DailyTrendDTO>> getDailyTrend(
            @RequestParam(defaultValue = "30") int days) {
        List<DailyTrendDTO> trend = trafficService.getDailyTrend(days);
        return Result.success(trend);
    }

    /**
     * 获取IP访问排行
     * @param days 统计天数，默认7天
     * @param limit 返回条数，默认10条
     */
    @GetMapping("/top-ips")
    public Result<List<IpStatsDTO>> getTopIps(
            @RequestParam(defaultValue = "7") int days,
            @RequestParam(defaultValue = "10") int limit) {
        List<IpStatsDTO> topIps = trafficService.getTopIps(days, limit);
        return Result.success(topIps);
    }

    /**
     * 获取路径访问排行
     * @param days 统计天数，默认7天
     * @param limit 返回条数，默认10条
     */
    @GetMapping("/top-paths")
    public Result<List<PathStatsDTO>> getTopPaths(
            @RequestParam(defaultValue = "7") int days,
            @RequestParam(defaultValue = "10") int limit) {
        List<PathStatsDTO> topPaths = trafficService.getTopPaths(days, limit);
        return Result.success(topPaths);
    }

    /**
     * 获取时段分布（24小时）
     * @param days 统计天数，默认7天
     */
    @GetMapping("/hourly")
    public Result<List<HourlyStatsDTO>> getHourlyDistribution(
            @RequestParam(defaultValue = "7") int days) {
        List<HourlyStatsDTO> hourly = trafficService.getHourlyDistribution(days);
        return Result.success(hourly);
    }
}