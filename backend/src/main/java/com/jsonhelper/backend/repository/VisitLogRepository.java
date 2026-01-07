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
     * 按日期统计每日PV趋势
     * 返回: [日期字符串, PV数量]
     */
    @Query("SELECT FUNCTION('DATE', v.createdAt) as date, COUNT(v) as pv " +
           "FROM VisitLog v WHERE v.createdAt >= :start AND v.createdAt < :end " +
           "GROUP BY FUNCTION('DATE', v.createdAt) ORDER BY date")
    List<Object[]> countDailyPv(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * 按日期统计每日UV趋势
     * 返回: [日期字符串, UV数量]
     */
    @Query("SELECT FUNCTION('DATE', v.createdAt) as date, COUNT(DISTINCT v.ip) as uv " +
           "FROM VisitLog v WHERE v.createdAt >= :start AND v.createdAt < :end " +
           "GROUP BY FUNCTION('DATE', v.createdAt) ORDER BY date")
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
     * 按小时统计访问分布（24小时）
     * 返回: [小时(0-23), 访问次数]
     */
    @Query("SELECT FUNCTION('HOUR', v.createdAt) as hour, COUNT(v) as cnt " +
           "FROM VisitLog v WHERE v.createdAt >= :start AND v.createdAt < :end " +
           "GROUP BY FUNCTION('HOUR', v.createdAt) ORDER BY hour")
    List<Object[]> countByHour(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
