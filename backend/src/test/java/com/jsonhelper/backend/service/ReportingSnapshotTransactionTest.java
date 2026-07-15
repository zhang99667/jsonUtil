package com.jsonhelper.backend.service;

import org.junit.jupiter.api.Test;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.AnnotationTransactionAttributeSource;
import org.springframework.transaction.interceptor.TransactionAttribute;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReportingSnapshotTransactionTest {

    @Test
    void trafficAggregationsUseReadOnlyRepeatableReadSnapshots() throws NoSuchMethodException {
        assertReadOnlyRepeatableRead(TrafficService.class.getMethod("getOverview", int.class));
        assertReadOnlyRepeatableRead(TrafficService.class.getMethod("getDailyTrend", int.class));
    }

    @Test
    void adminStatisticsUsesReadOnlyRepeatableReadSnapshot() throws NoSuchMethodException {
        assertReadOnlyRepeatableRead(StatisticsService.class.getMethod("getStatistics"));
    }

    @Test
    void sessionDurationStreamUsesReadOnlyTransaction() throws NoSuchMethodException {
        TransactionAttribute attribute = transactionAttribute(
                TrafficService.class.getMethod("getSessionDurationStats", int.class)
        );

        assertTrue(attribute.isReadOnly());
    }

    private static void assertReadOnlyRepeatableRead(Method method) {
        TransactionAttribute attribute = transactionAttribute(method);

        assertTrue(attribute.isReadOnly());
        assertEquals(TransactionDefinition.ISOLATION_REPEATABLE_READ, attribute.getIsolationLevel());
    }

    private static TransactionAttribute transactionAttribute(Method method) {
        TransactionAttribute attribute = new AnnotationTransactionAttributeSource()
                .getTransactionAttribute(method, method.getDeclaringClass());
        assertNotNull(attribute);
        return attribute;
    }
}
