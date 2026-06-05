package com.jsonhelper.backend.service;

import com.jsonhelper.backend.dto.response.*;
import com.jsonhelper.backend.repository.VisitLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrafficService {

    private final VisitLogRepository visitLogRepository;
    private final GeoService geoService;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * 获取流量概览数据
     * @param days 统计天数 (7天/30天等)
     */
    public TrafficOverviewDTO getOverview(int days) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = LocalDate.now().minusDays(days - 1).atStartOfDay();
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();

        long totalPv = visitLogRepository.countTotalPv(start, now);
        long totalUv = visitLogRepository.countTotalUv(start, now);
        long todayPv = visitLogRepository.countTotalPv(todayStart, now);
        long todayUv = visitLogRepository.countTotalUv(todayStart, now);

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
    public List<DailyTrendDTO> getDailyTrend(int days) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = LocalDate.now().minusDays(days - 1).atStartOfDay();

        List<Object[]> pvData = visitLogRepository.countDailyPv(start, now);
        List<Object[]> uvData = visitLogRepository.countDailyUv(start, now);

        // 将UV数据转换为Map便于查找
        Map<String, Long> uvMap = new HashMap<>();
        for (Object[] row : uvData) {
            String date = formatDate(row[0]);
            Long uv = ((Number) row[1]).longValue();
            uvMap.put(date, uv);
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

        // 填充PV数据
        for (Object[] row : pvData) {
            String date = formatDate(row[0]);
            Long pv = ((Number) row[1]).longValue();
            if (resultMap.containsKey(date)) {
                resultMap.get(date).setPv(pv);
            }
        }

        // 填充UV数据
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
        if (limit <= 0) {
            return Collections.emptyList();
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = LocalDate.now().minusDays(days - 1).atStartOfDay();

        List<Object[]> data = visitLogRepository.countByIpTopN(start, now, PageRequest.of(0, limit));

        return data.stream()
                .map(row -> {
                    String ip = (String) row[0];
                    GeoService.GeoInfo geoInfo = geoService.parseIp(ip);

                    return IpStatsDTO.builder()
                            .ip(ip)
                            .count(((Number) row[1]).longValue())
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
        if (limit <= 0) {
            return Collections.emptyList();
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = LocalDate.now().minusDays(days - 1).atStartOfDay();

        List<Object[]> data = visitLogRepository.countByPathTopN(start, now, PageRequest.of(0, limit));

        return data.stream()
                .map(row -> PathStatsDTO.builder()
                        .path((String) row[0])
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * 获取时段分布（24小时）
     * @param days 统计天数
     */
    public List<HourlyStatsDTO> getHourlyDistribution(int days) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = LocalDate.now().minusDays(days - 1).atStartOfDay();

        List<Object[]> data = visitLogRepository.countByHour(start, now);

        // 创建24小时的完整列表
        Map<Integer, Long> hourMap = new HashMap<>();
        for (Object[] row : data) {
            Integer hour = ((Number) row[0]).intValue();
            Long count = ((Number) row[1]).longValue();
            hourMap.put(hour, count);
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
        if (limit <= 0) {
            return Collections.emptyList();
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = LocalDate.now().minusDays(days - 1).atStartOfDay();

        List<Object[]> ipCounts = visitLogRepository.countByIpInRange(start, now);

        if (ipCounts.isEmpty()) {
            return Collections.emptyList();
        }

        // 先按IP在数据库聚合，再按访问次数累加地区，避免重复解析相同IP
        Map<String, Long> regionCountMap = new HashMap<>();
        long total = 0;
        for (Object[] row : ipCounts) {
            String ip = (String) row[0];
            long count = ((Number) row[1]).longValue();
            GeoService.GeoInfo geoInfo = geoService.parseIp(ip);
            String region = geoInfo.getRegionForStats();
            regionCountMap.merge(region, count, Long::sum);
            total += count;
        }

        final long finalTotal = Math.max(total, 1);

        // 转换为DTO并排序
        return regionCountMap.entrySet().stream()
                .map(entry -> GeoStatsDTO.builder()
                        .region(entry.getKey())
                        .count(entry.getValue())
                        .percentage(Math.round(entry.getValue() * 10000.0 / finalTotal) / 100.0)
                        .build())
                .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    /**
     * 获取设备类型分布统计
     * @param days 统计天数
     * @param limit 返回条数
     */
    public List<DeviceStatsDTO> getDeviceDistribution(int days, int limit) {
        if (limit <= 0) {
            return Collections.emptyList();
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = LocalDate.now().minusDays(days - 1).atStartOfDay();

        List<Object[]> userAgentCounts = visitLogRepository.countByUserAgentInRange(start, now);

        if (userAgentCounts.isEmpty()) {
            return Collections.emptyList();
        }

        // 先按UA在数据库聚合，再按访问次数累加设备类型
        Map<String, Long> deviceCountMap = new HashMap<>();
        long total = 0;
        for (Object[] row : userAgentCounts) {
            String userAgent = (String) row[0];
            long count = ((Number) row[1]).longValue();
            String device = parseDeviceType(userAgent);
            deviceCountMap.merge(device, count, Long::sum);
            total += count;
        }

        final long finalTotal = Math.max(total, 1);

        return deviceCountMap.entrySet().stream()
                .map(entry -> DeviceStatsDTO.builder()
                        .device(entry.getKey())
                        .browser(null)
                        .count(entry.getValue())
                        .percentage(Math.round(entry.getValue() * 10000.0 / finalTotal) / 100.0)
                        .build())
                .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    /**
     * 获取浏览器分布统计
     * @param days 统计天数
     * @param limit 返回条数
     */
    public List<DeviceStatsDTO> getBrowserDistribution(int days, int limit) {
        if (limit <= 0) {
            return Collections.emptyList();
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = LocalDate.now().minusDays(days - 1).atStartOfDay();

        List<Object[]> userAgentCounts = visitLogRepository.countByUserAgentInRange(start, now);

        if (userAgentCounts.isEmpty()) {
            return Collections.emptyList();
        }

        // 先按UA在数据库聚合，再按访问次数累加浏览器类型
        Map<String, Long> browserCountMap = new HashMap<>();
        long total = 0;
        for (Object[] row : userAgentCounts) {
            String userAgent = (String) row[0];
            long count = ((Number) row[1]).longValue();
            String browser = parseBrowser(userAgent);
            browserCountMap.merge(browser, count, Long::sum);
            total += count;
        }

        final long finalTotal = Math.max(total, 1);

        return browserCountMap.entrySet().stream()
                .map(entry -> DeviceStatsDTO.builder()
                        .device(null)
                        .browser(entry.getKey())
                        .count(entry.getValue())
                        .percentage(Math.round(entry.getValue() * 10000.0 / finalTotal) / 100.0)
                        .build())
                .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    /**
     * 获取来源分布统计
     * @param days 统计天数
     * @param limit 返回条数
     */
    public List<RefererStatsDTO> getRefererDistribution(int days, int limit) {
        if (limit <= 0) {
            return Collections.emptyList();
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = LocalDate.now().minusDays(days - 1).atStartOfDay();

        List<Object[]> refererCounts = visitLogRepository.countByRefererInRange(start, now);

        if (refererCounts.isEmpty()) {
            return Collections.emptyList();
        }

        // 先按Referer在数据库聚合，再按访问次数累加来源分类
        Map<String, Long> sourceCountMap = new HashMap<>();
        long total = 0;
        for (Object[] row : refererCounts) {
            String referer = (String) row[0];
            long count = ((Number) row[1]).longValue();
            String source = parseRefererSource(referer);
            sourceCountMap.merge(source, count, Long::sum);
            total += count;
        }

        final long finalTotal = Math.max(total, 1);

        return sourceCountMap.entrySet().stream()
                .map(entry -> RefererStatsDTO.builder()
                        .source(entry.getKey())
                        .domain(null)
                        .count(entry.getValue())
                        .percentage(Math.round(entry.getValue() * 10000.0 / finalTotal) / 100.0)
                        .build())
                .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    /**
     * 获取停留时长分布统计
     * 基于同一IP在时间窗口内的连续访问计算会话时长
     * @param days 统计天数
     */
    public List<SessionStatsDTO> getSessionDurationStats(int days) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = LocalDate.now().minusDays(days - 1).atStartOfDay();

        List<VisitLogRepository.SessionVisitEvent> events = visitLogRepository.findSessionVisitEvents(start, now);

        if (events.isEmpty()) {
            return getEmptyDurationStats();
        }

        // 时长统计桶
        Map<String, Long> durationBuckets = new LinkedHashMap<>();
        durationBuckets.put("0-10秒", 0L);
        durationBuckets.put("10-30秒", 0L);
        durationBuckets.put("30秒-1分钟", 0L);
        durationBuckets.put("1-3分钟", 0L);
        durationBuckets.put("3-10分钟", 0L);
        durationBuckets.put("10分钟以上", 0L);

        int totalSessions = 0;

        String currentIp = null;
        LocalDateTime sessionStartTime = null;
        LocalDateTime lastVisitTime = null;
        int sessionVisitCount = 0;

        for (VisitLogRepository.SessionVisitEvent event : events) {
            String ip = event.getIp();
            LocalDateTime visitTime = event.getCreatedAt();
            if (ip == null || visitTime == null) {
                continue;
            }

            boolean isNewIp = currentIp == null || !currentIp.equals(ip);
            boolean isNewSession = isNewIp || Duration.between(lastVisitTime, visitTime).toMinutes() > 30;

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

        final int finalTotal = Math.max(totalSessions, 1);

        return durationBuckets.entrySet().stream()
                .map(entry -> SessionStatsDTO.builder()
                        .durationRange(entry.getKey())
                        .count(entry.getValue())
                        .percentage(Math.round(entry.getValue() * 10000.0 / finalTotal) / 100.0)
                        .build())
                .collect(Collectors.toList());
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
     * 返回空的时长统计
     */
    private List<SessionStatsDTO> getEmptyDurationStats() {
        return Arrays.asList(
                SessionStatsDTO.builder().durationRange("0-10秒").count(0).percentage(0).build(),
                SessionStatsDTO.builder().durationRange("10-30秒").count(0).percentage(0).build(),
                SessionStatsDTO.builder().durationRange("30秒-1分钟").count(0).percentage(0).build(),
                SessionStatsDTO.builder().durationRange("1-3分钟").count(0).percentage(0).build(),
                SessionStatsDTO.builder().durationRange("3-10分钟").count(0).percentage(0).build(),
                SessionStatsDTO.builder().durationRange("10分钟以上").count(0).percentage(0).build()
        );
    }

    /**
     * 解析来源分类
     */
    private String parseRefererSource(String referer) {
        if (referer == null || referer.isEmpty()) {
            return "直接访问";
        }
        
        String lowerReferer = referer.toLowerCase();
        
        // 本站链接
        if (lowerReferer.contains("jsonutils") || lowerReferer.contains("localhost") 
            || lowerReferer.contains("127.0.0.1")) {
            return "站内跳转";
        }
        
        // 搜索引擎
        if (lowerReferer.contains("google.") || lowerReferer.contains("bing.") 
            || lowerReferer.contains("baidu.") || lowerReferer.contains("sogou.")
            || lowerReferer.contains("so.com") || lowerReferer.contains("yahoo.")
            || lowerReferer.contains("duckduckgo.")) {
            return "搜索引擎";
        }
        
        // 社交媒体
        if (lowerReferer.contains("weibo.") || lowerReferer.contains("weixin.")
            || lowerReferer.contains("wechat.") || lowerReferer.contains("qq.")
            || lowerReferer.contains("zhihu.") || lowerReferer.contains("douyin.")
            || lowerReferer.contains("tiktok.") || lowerReferer.contains("twitter.")
            || lowerReferer.contains("facebook.") || lowerReferer.contains("linkedin.")
            || lowerReferer.contains("instagram.") || lowerReferer.contains("reddit.")) {
            return "社交媒体";
        }
        
        // 技术社区
        if (lowerReferer.contains("github.") || lowerReferer.contains("gitee.")
            || lowerReferer.contains("csdn.") || lowerReferer.contains("juejin.")
            || lowerReferer.contains("segmentfault.") || lowerReferer.contains("stackoverflow.")
            || lowerReferer.contains("v2ex.")) {
            return "技术社区";
        }
        
        return "外部链接";
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

    /**
     * 格式化日期对象为字符串
     */
    private String formatDate(Object dateObj) {
        if (dateObj instanceof java.sql.Date) {
            return ((java.sql.Date) dateObj).toLocalDate().format(DATE_FORMATTER);
        } else if (dateObj instanceof LocalDate) {
            return ((LocalDate) dateObj).format(DATE_FORMATTER);
        } else if (dateObj instanceof String) {
            return (String) dateObj;
        }
        return dateObj.toString();
    }
}
