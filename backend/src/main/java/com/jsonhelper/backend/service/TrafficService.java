package com.jsonhelper.backend.service;

import com.jsonhelper.backend.dto.response.*;
import com.jsonhelper.backend.repository.VisitLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrafficService {

    private final VisitLogRepository visitLogRepository;
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
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = LocalDate.now().minusDays(days - 1).atStartOfDay();

        List<Object[]> data = visitLogRepository.countByIpTopN(start, now);

        return data.stream()
                .limit(limit)
                .map(row -> IpStatsDTO.builder()
                        .ip((String) row[0])
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * 获取路径访问排行
     * @param days 统计天数
     * @param limit 返回条数
     */
    public List<PathStatsDTO> getTopPaths(int days, int limit) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = LocalDate.now().minusDays(days - 1).atStartOfDay();

        List<Object[]> data = visitLogRepository.countByPathTopN(start, now);

        return data.stream()
                .limit(limit)
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