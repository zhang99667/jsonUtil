package com.jsonhelper.backend.repository;

import com.jsonhelper.backend.entity.VisitLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface VisitLogRepository extends JpaRepository<VisitLog, Long> {

    @Query("SELECT COUNT(v) FROM VisitLog v WHERE v.createdAt >= :start AND v.path = :path")
    long countPvByPathSince(@Param("start") LocalDateTime start, @Param("path") String path);

    @Query("SELECT COUNT(DISTINCT v.ip) FROM VisitLog v WHERE v.createdAt >= :start AND v.path = :path")
    long countUvByPathSince(@Param("start") LocalDateTime start, @Param("path") String path);

    long countByCreatedAtAfter(LocalDateTime start);
}
