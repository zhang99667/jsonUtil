package com.jsonhelper.backend.repository;

import com.jsonhelper.backend.dto.UpdateUserRequest;
import com.jsonhelper.backend.service.UserService;
import jakarta.persistence.LockModeType;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class UserRepositoryLockContractTest {

    @Test
    void enabledAdminLookupUsesPessimisticWriteLock() throws NoSuchMethodException {
        Method method = UserRepository.class.getMethod(
                "findByRoleAndEnabledTrueOrderById",
                String.class
        );

        Lock lock = method.getAnnotation(Lock.class);

        assertNotNull(lock);
        assertEquals(LockModeType.PESSIMISTIC_WRITE, lock.value());
    }

    @Test
    void accessRemovingOperationsHoldTheLockInsideATransaction() throws NoSuchMethodException {
        assertTransactional(UserService.class.getMethod(
                "updateUser",
                Long.class,
                UpdateUserRequest.class
        ));
        assertTransactional(UserService.class.getMethod("deleteUser", Long.class));
        assertTransactional(UserService.class.getMethod("toggleUserEnabled", Long.class));
    }

    private void assertTransactional(Method method) {
        assertNotNull(method.getAnnotation(Transactional.class));
    }
}
