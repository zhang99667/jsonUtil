package com.jsonhelper.backend.service;

import com.jsonhelper.backend.dto.response.StatisticsDTO;
import com.jsonhelper.backend.repository.OrderRepository;
import com.jsonhelper.backend.repository.SubscriptionRepository;
import com.jsonhelper.backend.repository.UserRepository;
import com.jsonhelper.backend.repository.VisitLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final OrderRepository orderRepository;
    private final VisitLogRepository visitLogRepository;

    public StatisticsDTO getStatistics() {
        long totalUsers = userRepository.count();
        long activeSubscriptions = subscriptionRepository.count(); // Assuming all subs in repo are active for now, or
                                                                   // refine logic later
        BigDecimal totalRevenue = orderRepository.sumPaidAmount();

        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime now = LocalDateTime.now();
        // 统计全站流量，与TrafficService保持一致
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
