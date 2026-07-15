package com.jsonhelper.backend.repository;

import com.jsonhelper.backend.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findByUserId(Long userId);

    @Query("""
            SELECT COUNT(DISTINCT subscription.userId)
            FROM Subscription subscription
            WHERE subscription.status = 'ACTIVE'
              AND (subscription.expireTime IS NULL OR subscription.expireTime > :now)
            """)
    long countActiveAt(@Param("now") LocalDateTime now);
}
