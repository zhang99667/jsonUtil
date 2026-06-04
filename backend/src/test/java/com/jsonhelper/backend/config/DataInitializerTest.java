package com.jsonhelper.backend.config;

import com.jsonhelper.backend.entity.User;
import com.jsonhelper.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataInitializerTest {

    @Mock
    UserRepository userRepository;

    @Mock
    PasswordEncoder passwordEncoder;

    private DataInitializer dataInitializer;

    @BeforeEach
    void setUp() {
        dataInitializer = new DataInitializer();
        ReflectionTestUtils.setField(dataInitializer, "userRepository", userRepository);
        ReflectionTestUtils.setField(dataInitializer, "passwordEncoder", passwordEncoder);
        ReflectionTestUtils.setField(dataInitializer, "bootstrapEmail", "admin@example.com");
    }

    @Test
    void runSkipsBootstrapByDefault() throws Exception {
        ReflectionTestUtils.setField(dataInitializer, "bootstrapEnabled", false);

        dataInitializer.run();

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void runRejectsMissingBootstrapPassword() {
        ReflectionTestUtils.setField(dataInitializer, "bootstrapEnabled", true);
        ReflectionTestUtils.setField(dataInitializer, "bootstrapUsername", "admin");
        ReflectionTestUtils.setField(dataInitializer, "bootstrapPassword", "");

        assertThrows(IllegalStateException.class, () -> dataInitializer.run());
    }

    @Test
    void runCreatesBootstrapAdminWhenConfigured() throws Exception {
        ReflectionTestUtils.setField(dataInitializer, "bootstrapEnabled", true);
        ReflectionTestUtils.setField(dataInitializer, "bootstrapUsername", "admin");
        ReflectionTestUtils.setField(dataInitializer, "bootstrapPassword", "strong-password");
        when(userRepository.findByUsername("admin")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("strong-password")).thenReturn("encoded-password");

        dataInitializer.run();

        verify(userRepository).save(any(User.class));
    }
}
