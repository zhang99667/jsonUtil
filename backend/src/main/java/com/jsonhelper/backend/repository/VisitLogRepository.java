package com.jsonhelper.backend.repository;

import com.jsonhelper.backend.entity.VisitLog;
import jakarta.persistence.QueryHint;
import org.hibernate.jpa.HibernateHints;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Stream;

@Repository
public interface VisitLogRepository extends JpaRepository<VisitLog, Long> {

    interface DateCount {
        LocalDate getDate();

        long getCount();
    }

    interface GroupCount {
        String getLabel();

        long getCount();
    }

    interface HourCount {
        int getHour();

        long getCount();
    }

    interface SessionVisitEvent {
        String getIp();

        LocalDateTime getCreatedAt();
    }

    @Query("SELECT COUNT(v) FROM VisitLog v WHERE v.createdAt >= :start AND v.path = :path")
    long countPvByPathSince(@Param("start") LocalDateTime start, @Param("path") String path);

    @Query("SELECT COUNT(DISTINCT v.ip) FROM VisitLog v WHERE v.createdAt >= :start AND v.path = :path")
    long countUvByPathSince(@Param("start") LocalDateTime start, @Param("path") String path);

    long countByCreatedAtAfter(LocalDateTime start);

    // ============ 流量统计查询方法 ============

    /**
     * 统计指定日期范围内的总PV
     */
    @Query("SELECT COUNT(v) FROM VisitLog v WHERE v.createdAt >= :start AND v.createdAt < :end")
    long countTotalPv(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * 统计指定日期范围内的总UV
     */
    @Query("SELECT COUNT(DISTINCT v.ip) FROM VisitLog v WHERE v.createdAt >= :start AND v.createdAt < :end")
    long countTotalUv(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * 按日期统计每日 PV 趋势（使用原生 SQL，兼容 PostgreSQL）
     */
    @Query(value = "SELECT DATE(created_at) AS date, COUNT(*) AS count " +
           "FROM visit_logs WHERE created_at >= :start AND created_at < :end " +
           "GROUP BY DATE(created_at) ORDER BY date", nativeQuery = true)
    List<DateCount> countDailyPv(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * 按日期统计每日 UV 趋势（使用原生 SQL，兼容 PostgreSQL）
     */
    @Query(value = "SELECT DATE(created_at) AS date, COUNT(DISTINCT ip) AS count " +
           "FROM visit_logs WHERE created_at >= :start AND created_at < :end " +
           "GROUP BY DATE(created_at) ORDER BY date", nativeQuery = true)
    List<DateCount> countDailyUv(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * 按 IP 统计访问次数排行
     */
    @Query("SELECT v.ip AS label, COUNT(v) AS count FROM VisitLog v " +
           "WHERE v.createdAt >= :start AND v.createdAt < :end " +
           "GROUP BY v.ip ORDER BY COUNT(v) DESC")
    List<GroupCount> countByIpTopN(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end, Pageable pageable);

    /**
     * 按 IP 聚合访问次数（用于地理位置统计，避免逐条访问记录解析 IP）
     */
    @Query("SELECT v.ip AS label, COUNT(v) AS count FROM VisitLog v " +
           "WHERE v.createdAt >= :start AND v.createdAt < :end " +
           "GROUP BY v.ip")
    List<GroupCount> countByIpInRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * 按用户代理聚合访问次数，避免逐条解析重复设备信息
     */
    @Query("SELECT v.userAgent AS label, COUNT(v) AS count FROM VisitLog v " +
           "WHERE v.createdAt >= :start AND v.createdAt < :end " +
           "GROUP BY v.userAgent")
    List<GroupCount> countByUserAgentInRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * 按来源地址聚合访问次数，避免逐条解析重复来源
     */
    @Query("SELECT v.referer AS label, COUNT(v) AS count FROM VisitLog v " +
           "WHERE v.createdAt >= :start AND v.createdAt < :end " +
           "GROUP BY v.referer")
    List<GroupCount> countByRefererInRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * 按路径统计访问次数排行
     */
    @Query("SELECT v.path AS label, COUNT(v) AS count FROM VisitLog v " +
           "WHERE v.createdAt >= :start AND v.createdAt < :end " +
           "GROUP BY v.path ORDER BY COUNT(v) DESC")
    List<GroupCount> countByPathTopN(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end, Pageable pageable);

    /**
     * 按小时统计访问分布（使用原生 SQL，兼容 PostgreSQL）
     */
    @Query(value = "SELECT CAST(EXTRACT(HOUR FROM created_at) AS integer) AS hour, COUNT(*) AS count " +
           "FROM visit_logs WHERE created_at >= :start AND created_at < :end " +
           "GROUP BY EXTRACT(HOUR FROM created_at) ORDER BY hour", nativeQuery = true)
    List<HourCount> countByHour(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * 流式查询指定时间范围内的会话计算事件；调用方必须关闭返回流
     */
    @Query("SELECT v.ip AS ip, v.createdAt AS createdAt FROM VisitLog v " +
           "WHERE v.createdAt >= :start AND v.createdAt < :end AND v.ip IS NOT NULL " +
           "ORDER BY v.ip ASC, v.createdAt ASC")
    @QueryHints(@QueryHint(name = HibernateHints.HINT_FETCH_SIZE, value = "1000"))
    Stream<SessionVisitEvent> streamSessionVisitEvents(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
