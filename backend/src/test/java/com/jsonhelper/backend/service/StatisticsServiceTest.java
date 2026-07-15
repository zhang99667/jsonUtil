package com.jsonhelper.backend.service;

import com.jsonhelper.backend.dto.response.StatisticsDTO;
import com.jsonhelper.backend.repository.OrderRepository;
import com.jsonhelper.backend.repository.SubscriptionRepository;
import com.jsonhelper.backend.repository.UserRepository;
import com.jsonhelper.backend.repository.VisitLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StatisticsServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private VisitLogRepository visitLogRepository;

    private StatisticsService statisticsService;

    @BeforeEach
    void setUp() {
        statisticsService = new StatisticsService(
                userRepository,
                subscriptionRepository,
                orderRepository,
                visitLogRepository
        );
    }

    @Test
    void statisticsCountsOnlySubscriptionsActiveAtQueryTime() {
        when(userRepository.count()).thenReturn(12L);
        when(subscriptionRepository.countActiveAt(any(LocalDateTime.class))).thenReturn(3L);
        when(orderRepository.sumPaidAmount()).thenReturn(null);
        when(visitLogRepository.countTotalPv(any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(8L);
        when(visitLogRepository.countTotalUv(any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(5L);

        StatisticsDTO result = statisticsService.getStatistics();

        assertEquals(12L, result.getTotalUsers());
        assertEquals(3L, result.getActiveSubscriptions());
        assertEquals(BigDecimal.ZERO, result.getTotalRevenue());
        assertEquals(8L, result.getTodayPv());
        assertEquals(5L, result.getTodayUv());

        ArgumentCaptor<LocalDateTime> activeAtCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> trafficEndCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(subscriptionRepository).countActiveAt(activeAtCaptor.capture());
        verify(visitLogRepository).countTotalPv(any(LocalDateTime.class), trafficEndCaptor.capture());
        assertSame(activeAtCaptor.getValue(), trafficEndCaptor.getValue());
        verify(subscriptionRepository, never()).count();
    }
}
