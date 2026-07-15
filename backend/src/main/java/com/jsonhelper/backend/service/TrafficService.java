package com.jsonhelper.backend.service;

import com.jsonhelper.backend.dto.response.*;
import com.jsonhelper.backend.repository.VisitLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class TrafficService {

    private final VisitLogRepository visitLogRepository;
    private final GeoService geoService;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final Duration SESSION_INACTIVITY_TIMEOUT = Duration.ofMinutes(30);
    private static final List<String> DURATION_BUCKET_NAMES = List.of(
            "0-10秒", "10-30秒", "30秒-1分钟", "1-3分钟", "3-10分钟", "10分钟以上"
    );

    /**
     * 获取流量概览数据
     * @param days 统计天数 (7天/30天等)
     */
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public TrafficOverviewDTO getOverview(int days) {
        TimeWindow timeWindow = currentTimeWindow(days);
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();

        long totalPv = visitLogRepository.countTotalPv(timeWindow.start(), timeWindow.end());
        long totalUv = visitLogRepository.countTotalUv(timeWindow.start(), timeWindow.end());
        long todayPv = visitLogRepository.countTotalPv(todayStart, timeWindow.end());
        long todayUv = visitLogRepository.countTotalUv(todayStart, timeWindow.end());

        double avgDailyPv = days > 0 ? (double) totalPv / days : 0;
        double avgDailyUv = days > 0 ? (double) totalUv / days : 0;

        return TrafficOverviewDTO.builder()
                .totalPv(totalPv)
                .totalUv(totalUv)
                .todayPv(todayPv)
                .todayUv(todayUv)
                .avgDailyPv(Math.round(avgDailyPv * 100.0) / 100.0)
                .avgDailyUv(Math.round(avgDailyUv * 100.0) / 100.0)
                .days(days)
                .build();
    }

    /**
     * 获取每日趋势数据
     * @param days 统计天数
     */
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public List<DailyTrendDTO> getDailyTrend(int days) {
        TimeWindow timeWindow = currentTimeWindow(days);

        List<VisitLogRepository.DateCount> pvData = visitLogRepository.countDailyPv(timeWindow.start(), timeWindow.end());
        List<VisitLogRepository.DateCount> uvData = visitLogRepository.countDailyUv(timeWindow.start(), timeWindow.end());

        // 将 UV 数据转换为映射，便于按日期查找。
        Map<String, Long> uvMap = new HashMap<>();
        for (VisitLogRepository.DateCount row : uvData) {
            uvMap.put(row.getDate().format(DATE_FORMATTER), row.getCount());
        }

        // 生成完整日期列表（填充无数据的日期）
        Map<String, DailyTrendDTO> resultMap = new LinkedHashMap<>();
        for (int i = days - 1; i >= 0; i--) {
            String date = LocalDate.now().minusDays(i).format(DATE_FORMATTER);
            resultMap.put(date, DailyTrendDTO.builder()
                    .date(date)
                    .pv(0)
                    .uv(0)
                    .build());
        }

        // 填充 PV 数据。
        for (VisitLogRepository.DateCount row : pvData) {
            String date = row.getDate().format(DATE_FORMATTER);
            if (resultMap.containsKey(date)) {
                resultMap.get(date).setPv(row.getCount());
            }
        }

        // 填充 UV 数据。
        for (Map.Entry<String, Long> entry : uvMap.entrySet()) {
            if (resultMap.containsKey(entry.getKey())) {
                resultMap.get(entry.getKey()).setUv(entry.getValue());
            }
        }

        return new ArrayList<>(resultMap.values());
    }

    /**
     * 获取IP访问排行
     * @param days 统计天数
     * @param limit 返回条数
     */
    public List<IpStatsDTO> getTopIps(int days, int limit) {
        if (hasNoLimit(limit)) {
            return Collections.emptyList();
        }

        TimeWindow timeWindow = currentTimeWindow(days);

        List<VisitLogRepository.GroupCount> data = visitLogRepository.countByIpTopN(
                timeWindow.start(), timeWindow.end(), PageRequest.of(0, limit)
        );

        return data.stream()
                .map(row -> {
                    String ip = row.getLabel();
                    GeoService.GeoInfo geoInfo = geoService.parseIp(ip);

                    return IpStatsDTO.builder()
                            .ip(ip)
                            .count(row.getCount())
                            .region(geoInfo.getRegionForStats())
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * 获取路径访问排行
     * @param days 统计天数
     * @param limit 返回条数
     */
    public List<PathStatsDTO> getTopPaths(int days, int limit) {
        if (hasNoLimit(limit)) {
            return Collections.emptyList();
        }

        TimeWindow timeWindow = currentTimeWindow(days);

        List<VisitLogRepository.GroupCount> data = visitLogRepository.countByPathTopN(
                timeWindow.start(), timeWindow.end(), PageRequest.of(0, limit)
        );

        return data.stream()
                .map(row -> PathStatsDTO.builder()
                        .path(row.getLabel())
                        .count(row.getCount())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * 获取时段分布（24小时）
     * @param days 统计天数
     */
    public List<HourlyStatsDTO> getHourlyDistribution(int days) {
        TimeWindow timeWindow = currentTimeWindow(days);

        List<VisitLogRepository.HourCount> data = visitLogRepository.countByHour(timeWindow.start(), timeWindow.end());

        // 创建24小时的完整列表
        Map<Integer, Long> hourMap = new HashMap<>();
        for (VisitLogRepository.HourCount row : data) {
            hourMap.put(row.getHour(), row.getCount());
        }

        List<HourlyStatsDTO> result = new ArrayList<>();
        for (int i = 0; i < 24; i++) {
            result.add(HourlyStatsDTO.builder()
                    .hour(i)
                    .count(hourMap.getOrDefault(i, 0L))
                    .build());
        }

        return result;
    }

    /**
     * 获取地理位置分布统计
     * @param days 统计天数
     * @param limit 返回条数
     */
    public List<GeoStatsDTO> getGeoDistribution(int days, int limit) {
        if (hasNoLimit(limit)) {
            return Collections.emptyList();
        }

        TimeWindow timeWindow = currentTimeWindow(days);

        List<VisitLogRepository.GroupCount> ipCounts = visitLogRepository.countByIpInRange(
                timeWindow.start(), timeWindow.end()
        );

        if (ipCounts.isEmpty()) {
            return Collections.emptyList();
        }

        // 先按IP在数据库聚合，再按访问次数累加地区，避免重复解析相同IP
        DistributionCounts regionCounts = aggregateDistributionCounts(
                ipCounts,
                ip -> geoService.parseIp(ip).getRegionForStats()
        );

        return buildDistributionStats(regionCounts, limit, (region, count, percentage) -> GeoStatsDTO.builder()
                .region(region)
                .count(count)
                .percentage(percentage)
                .build());
    }

    /**
     * 获取设备类型分布统计
     * @param days 统计天数
     * @param limit 返回条数
     */
    public List<DeviceStatsDTO> getDeviceDistribution(int days, int limit) {
        if (hasNoLimit(limit)) {
            return Collections.emptyList();
        }

        TimeWindow timeWindow = currentTimeWindow(days);

        List<VisitLogRepository.GroupCount> userAgentCounts = visitLogRepository.countByUserAgentInRange(
                timeWindow.start(), timeWindow.end()
        );

        if (userAgentCounts.isEmpty()) {
            return Collections.emptyList();
        }

        // 先按UA在数据库聚合，再按访问次数累加设备类型
        DistributionCounts deviceCounts = aggregateDistributionCounts(userAgentCounts, this::parseDeviceType);

        return buildDistributionStats(deviceCounts, limit, (device, count, percentage) -> DeviceStatsDTO.builder()
                .device(device)
                .browser(null)
                .count(count)
                .percentage(percentage)
                .build());
    }

    /**
     * 获取浏览器分布统计
     * @param days 统计天数
     * @param limit 返回条数
     */
    public List<DeviceStatsDTO> getBrowserDistribution(int days, int limit) {
        if (hasNoLimit(limit)) {
            return Collections.emptyList();
        }

        TimeWindow timeWindow = currentTimeWindow(days);

        List<VisitLogRepository.GroupCount> userAgentCounts = visitLogRepository.countByUserAgentInRange(
                timeWindow.start(), timeWindow.end()
        );

        if (userAgentCounts.isEmpty()) {
            return Collections.emptyList();
        }

        // 先按UA在数据库聚合，再按访问次数累加浏览器类型
        DistributionCounts browserCounts = aggregateDistributionCounts(userAgentCounts, this::parseBrowser);

        return buildDistributionStats(browserCounts, limit, (browser, count, percentage) -> DeviceStatsDTO.builder()
                .device(null)
                .browser(browser)
                .count(count)
                .percentage(percentage)
                .build());
    }

    /**
     * 获取来源分布统计
     * @param days 统计天数
     * @param limit 返回条数
     */
    public List<RefererStatsDTO> getRefererDistribution(int days, int limit) {
        if (hasNoLimit(limit)) {
            return Collections.emptyList();
        }

        TimeWindow timeWindow = currentTimeWindow(days);

        List<VisitLogRepository.GroupCount> refererCounts = visitLogRepository.countByRefererInRange(
                timeWindow.start(), timeWindow.end()
        );

        if (refererCounts.isEmpty()) {
            return Collections.emptyList();
        }

        // 先按来源地址在数据库聚合，再按访问次数累加来源分类
        DistributionCounts sourceCounts = aggregateDistributionCounts(
                refererCounts,
                RefererSourceClassifier::classify
        );

        return buildDistributionStats(sourceCounts, limit, (source, count, percentage) -> RefererStatsDTO.builder()
                .source(source)
                .domain(null)
                .count(count)
                .percentage(percentage)
                .build());
    }

    /**
     * 获取停留时长分布统计
     * 基于同一IP在时间窗口内的连续访问计算会话时长
     * @param days 统计天数
     */
    @Transactional(readOnly = true)
    public List<SessionStatsDTO> getSessionDurationStats(int days) {
        TimeWindow timeWindow = currentTimeWindow(days);
        try (Stream<VisitLogRepository.SessionVisitEvent> events = visitLogRepository.streamSessionVisitEvents(
                timeWindow.start(), timeWindow.end()
        )) {
            Iterator<VisitLogRepository.SessionVisitEvent> eventIterator = events.iterator();
            Map<String, Long> durationBuckets = createDurationBuckets();
            int totalSessions = 0;

            String currentIp = null;
            LocalDateTime sessionStartTime = null;
            LocalDateTime lastVisitTime = null;
            int sessionVisitCount = 0;

            while (eventIterator.hasNext()) {
                VisitLogRepository.SessionVisitEvent event = eventIterator.next();
                String ip = event.getIp();
                LocalDateTime visitTime = event.getCreatedAt();
                if (ip == null || visitTime == null) {
                    continue;
                }

                boolean isNewIp = currentIp == null || !currentIp.equals(ip);
                boolean isNewSession = isNewIp
                        || Duration.between(lastVisitTime, visitTime).compareTo(SESSION_INACTIVITY_TIMEOUT) > 0;

                if (isNewSession && sessionStartTime != null && lastVisitTime != null) {
                    addSessionDuration(durationBuckets, sessionStartTime, lastVisitTime, sessionVisitCount);
                    totalSessions++;
                }

                if (isNewSession) {
                    currentIp = ip;
                    sessionStartTime = visitTime;
                    sessionVisitCount = 0;
                }

                lastVisitTime = visitTime;
                sessionVisitCount++;
            }

            if (sessionStartTime != null && lastVisitTime != null) {
                addSessionDuration(durationBuckets, sessionStartTime, lastVisitTime, sessionVisitCount);
                totalSessions++;
            }

            return buildSessionStats(durationBuckets, totalSessions);
        }
    }

    private TimeWindow currentTimeWindow(int days) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = LocalDate.now().minusDays(days - 1).atStartOfDay();
        return new TimeWindow(start, now);
    }

    private boolean hasNoLimit(int limit) {
        return limit <= 0;
    }

    private DistributionCounts aggregateDistributionCounts(
            List<VisitLogRepository.GroupCount> rows,
            Function<String, String> categoryResolver
    ) {
        Map<String, Long> countMap = new HashMap<>();
        long total = 0;
        for (VisitLogRepository.GroupCount row : rows) {
            long count = row.getCount();
            String category = categoryResolver.apply(row.getLabel());
            countMap.merge(category, count, Long::sum);
            total += count;
        }
        return new DistributionCounts(countMap, total);
    }

    private <T> List<T> buildDistributionStats(
            DistributionCounts distributionCounts,
            int limit,
            DistributionStatsFactory<T> factory
    ) {
        long total = Math.max(distributionCounts.total(), 1);
        return distributionCounts.counts().entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(limit)
                .map(entry -> factory.create(
                        entry.getKey(),
                        entry.getValue(),
                        calculatePercentage(entry.getValue(), total)
                ))
                .collect(Collectors.toList());
    }

    private Map<String, Long> createDurationBuckets() {
        Map<String, Long> durationBuckets = new LinkedHashMap<>();
        for (String bucketName : DURATION_BUCKET_NAMES) {
            durationBuckets.put(bucketName, 0L);
        }
        return durationBuckets;
    }

    private List<SessionStatsDTO> buildSessionStats(Map<String, Long> durationBuckets, long totalSessions) {
        long total = Math.max(totalSessions, 1);
        return durationBuckets.entrySet().stream()
                .map(entry -> SessionStatsDTO.builder()
                        .durationRange(entry.getKey())
                        .count(entry.getValue())
                        .percentage(calculatePercentage(entry.getValue(), total))
                        .build())
                .collect(Collectors.toList());
    }

    private double calculatePercentage(long count, long total) {
        return Math.round(count * 10000.0 / total) / 100.0;
    }

    /**
     * 累加一个会话的停留时长
     */
    private void addSessionDuration(
            Map<String, Long> durationBuckets,
            LocalDateTime sessionStartTime,
            LocalDateTime lastVisitTime,
            int sessionVisitCount
    ) {
        long durationSeconds = sessionVisitCount <= 1
                ? 10
                : Duration.between(sessionStartTime, lastVisitTime).getSeconds();
        String bucket = getDurationBucket(durationSeconds);
        durationBuckets.merge(bucket, 1L, Long::sum);
    }

    /**
     * 获取时长所属桶
     */
    private String getDurationBucket(long seconds) {
        if (seconds < 10) return "0-10秒";
        if (seconds < 30) return "10-30秒";
        if (seconds < 60) return "30秒-1分钟";
        if (seconds < 180) return "1-3分钟";
        if (seconds < 600) return "3-10分钟";
        return "10分钟以上";
    }

    /**
     * 解析设备类型
     */
    private String parseDeviceType(String ua) {
        if (ua == null || ua.isEmpty()) {
            return "未知";
        }
        String lowerUa = ua.toLowerCase();
        
        // 检测爬虫/机器人
        if (lowerUa.contains("bot") || lowerUa.contains("spider") || lowerUa.contains("crawler") 
            || lowerUa.contains("slurp") || lowerUa.contains("googlebot") || lowerUa.contains("bingbot")) {
            return "爬虫";
        }
        // 检测移动设备
        if (lowerUa.contains("mobile") || lowerUa.contains("android") && !lowerUa.contains("tablet")
            || lowerUa.contains("iphone") || lowerUa.contains("ipod")) {
            return "手机";
        }
        // 检测平板
        if (lowerUa.contains("tablet") || lowerUa.contains("ipad")) {
            return "平板";
        }
        // 默认为PC
        if (lowerUa.contains("windows") || lowerUa.contains("macintosh") || lowerUa.contains("linux")) {
            return "电脑";
        }
        return "其他";
    }

    /**
     * 解析浏览器类型
     */
    private String parseBrowser(String ua) {
        if (ua == null || ua.isEmpty()) {
            return "未知";
        }
        String lowerUa = ua.toLowerCase();
        
        // 按检测优先级排序（有些UA包含多个浏览器标识）
        if (lowerUa.contains("edg/") || lowerUa.contains("edge/")) {
            return "Edge";
        }
        if (lowerUa.contains("opr/") || lowerUa.contains("opera")) {
            return "Opera";
        }
        if (lowerUa.contains("chrome") && !lowerUa.contains("chromium")) {
            return "Chrome";
        }
        if (lowerUa.contains("firefox")) {
            return "Firefox";
        }
        if (lowerUa.contains("safari") && !lowerUa.contains("chrome")) {
            return "Safari";
        }
        if (lowerUa.contains("msie") || lowerUa.contains("trident")) {
            return "IE";
        }
        // 检测常见爬虫
        if (lowerUa.contains("googlebot")) {
            return "Googlebot";
        }
        if (lowerUa.contains("bingbot")) {
            return "Bingbot";
        }
        if (lowerUa.contains("bot") || lowerUa.contains("spider")) {
            return "其他爬虫";
        }
        return "其他";
    }

    private record TimeWindow(LocalDateTime start, LocalDateTime end) {
    }

    private record DistributionCounts(Map<String, Long> counts, long total) {
    }

    @FunctionalInterface
    private interface DistributionStatsFactory<T> {
        T create(String name, long count, double percentage);
    }
}
