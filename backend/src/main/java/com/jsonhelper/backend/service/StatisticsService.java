package com.jsonhelper.backend.service;

import com.jsonhelper.backend.dto.response.StatisticsDTO;
import com.jsonhelper.backend.repository.OrderRepository;
import com.jsonhelper.backend.repository.SubscriptionRepository;
import com.jsonhelper.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final OrderRepository orderRepository;

    public StatisticsDTO getStatistics() {
        long totalUsers = userRepository.count();
        long activeSubscriptions = subscriptionRepository.count(); // Assuming all subs in repo are active for now, or
                                                                   // refine logic later
        BigDecimal totalRevenue = orderRepository.sumPaidAmount();

        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }

        return StatisticsDTO.builder()
                .totalUsers(totalUsers)
                .activeSubscriptions(activeSubscriptions)
                .totalRevenue(totalRevenue)
                .build();
    }
}
