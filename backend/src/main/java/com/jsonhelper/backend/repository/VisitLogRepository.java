package com.jsonhelper.backend.repository;

import com.jsonhelper.backend.entity.VisitLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VisitLogRepository extends JpaRepository<VisitLog, Long> {

    @Query("SELECT COUNT(v) FROM VisitLog v WHERE v.createdAt >= :start AND v.path = :path")
    long countPvByPathSince(@Param("start") LocalDateTime start, @Param("path") String path);

    @Query("SELECT COUNT(DISTINCT v.ip) FROM VisitLog v WHERE v.createdAt >= :start AND v.path = :path")
    long countUvByPathSince(@Param("start") LocalDateTime start, @Param("path") String path);

    long countByCreatedAtAfter(LocalDateTime start);

    // ============ Traffic Statistics Methods ============

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
     * 按日期统计每日PV趋势（使用原生SQL，兼容PostgreSQL）
     * 返回: [日期, PV数量]
     */
    @Query(value = "SELECT DATE(created_at) as date, COUNT(*) as pv " +
           "FROM visit_logs WHERE created_at >= :start AND created_at < :end " +
           "GROUP BY DATE(created_at) ORDER BY date", nativeQuery = true)
    List<Object[]> countDailyPv(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * 按日期统计每日UV趋势（使用原生SQL，兼容PostgreSQL）
     * 返回: [日期, UV数量]
     */
    @Query(value = "SELECT DATE(created_at) as date, COUNT(DISTINCT ip) as uv " +
           "FROM visit_logs WHERE created_at >= :start AND created_at < :end " +
           "GROUP BY DATE(created_at) ORDER BY date", nativeQuery = true)
    List<Object[]> countDailyUv(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * 按IP统计访问次数排行（TOP N）
     * 返回: [IP, 访问次数]
     */
    @Query("SELECT v.ip, COUNT(v) as cnt FROM VisitLog v " +
           "WHERE v.createdAt >= :start AND v.createdAt < :end " +
           "GROUP BY v.ip ORDER BY cnt DESC")
    List<Object[]> countByIpTopN(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * 按路径统计访问次数排行
     * 返回: [路径, 访问次数]
     */
    @Query("SELECT v.path, COUNT(v) as cnt FROM VisitLog v " +
           "WHERE v.createdAt >= :start AND v.createdAt < :end " +
           "GROUP BY v.path ORDER BY cnt DESC")
    List<Object[]> countByPathTopN(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * 按小时统计访问分布（24小时，使用原生SQL，兼容PostgreSQL）
     * 返回: [小时(0-23), 访问次数]
     */
    @Query(value = "SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as cnt " +
           "FROM visit_logs WHERE created_at >= :start AND created_at < :end " +
           "GROUP BY EXTRACT(HOUR FROM created_at) ORDER BY hour", nativeQuery = true)
    List<Object[]> countByHour(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * 查询指定时间范围内的访问记录（用于地理位置统计）
     */
    List<VisitLog> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
