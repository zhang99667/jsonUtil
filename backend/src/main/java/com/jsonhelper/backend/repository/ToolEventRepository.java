package com.jsonhelper.backend.repository;

import com.jsonhelper.backend.entity.ToolEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ToolEventRepository extends JpaRepository<ToolEvent, Long> {

    interface GroupCount {
        String getLabel();

        long getCount();
    }

    long countByCreatedAtGreaterThanEqual(LocalDateTime start);

    long countByCreatedAtGreaterThanEqualAndStatus(LocalDateTime start, String status);

    @Query("SELECT e.eventName AS label, COUNT(e) AS count FROM ToolEvent e " +
            "WHERE e.createdAt >= :start GROUP BY e.eventName ORDER BY COUNT(e) DESC")
    List<GroupCount> countByEventNameSince(@Param("start") LocalDateTime start, Pageable pageable);

    @Query("SELECT e.status AS label, COUNT(e) AS count FROM ToolEvent e " +
            "WHERE e.createdAt >= :start GROUP BY e.status ORDER BY COUNT(e) DESC")
    List<GroupCount> countByStatusSince(@Param("start") LocalDateTime start);

    @Query("SELECT e.inputSizeBucket AS label, COUNT(e) AS count FROM ToolEvent e " +
            "WHERE e.createdAt >= :start GROUP BY e.inputSizeBucket ORDER BY COUNT(e) DESC")
    List<GroupCount> countByInputSizeBucketSince(@Param("start") LocalDateTime start);

    @Query("SELECT e.durationBucket AS label, COUNT(e) AS count FROM ToolEvent e " +
            "WHERE e.createdAt >= :start GROUP BY e.durationBucket ORDER BY COUNT(e) DESC")
    List<GroupCount> countByDurationBucketSince(@Param("start") LocalDateTime start);
}
