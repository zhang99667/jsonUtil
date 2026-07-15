package com.jsonhelper.backend.service;

import com.jsonhelper.backend.dto.response.StatisticsDTO;
import com.jsonhelper.backend.repository.OrderRepository;
import com.jsonhelper.backend.repository.SubscriptionRepository;
import com.jsonhelper.backend.repository.UserRepository;
import com.jsonhelper.backend.repository.VisitLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final OrderRepository orderRepository;
    private final VisitLogRepository visitLogRepository;

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public StatisticsDTO getStatistics() {
        LocalDateTime now = LocalDateTime.now();
        long totalUsers = userRepository.count();
        long activeSubscriptions = subscriptionRepository.countActiveAt(now);
        BigDecimal totalRevenue = orderRepository.sumPaidAmount();

        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }

        LocalDateTime todayStart = now.toLocalDate().atStartOfDay();
        // 统计全站流量，与 TrafficService 保持一致。
        long todayPv = visitLogRepository.countTotalPv(todayStart, now);
        long todayUv = visitLogRepository.countTotalUv(todayStart, now);

        return StatisticsDTO.builder()
                .totalUsers(totalUsers)
                .activeSubscriptions(activeSubscriptions)
                .totalRevenue(totalRevenue)
                .todayPv(todayPv)
                .todayUv(todayUv)
                .build();
    }
}
