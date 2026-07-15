package com.jsonhelper.backend.config;

import com.jsonhelper.backend.entity.User;
import com.jsonhelper.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
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
        dataInitializer = new DataInitializer(userRepository, passwordEncoder);
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
        configureBootstrap("  strong-password  ");
        when(userRepository.findByUsername("admin")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("  strong-password  ")).thenReturn("encoded-password");

        dataInitializer.run();

        verify(passwordEncoder).encode("  strong-password  ");
        verify(userRepository).saveAndFlush(argThat(user ->
                "admin".equals(user.getUsername())
                        && "encoded-password".equals(user.getPasswordHash())
                        && "ADMIN".equals(user.getRole())
                        && Boolean.TRUE.equals(user.getEnabled())
        ));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void runSkipsExistingEnabledAdmin() throws Exception {
        configureBootstrap("strong-password");
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user("ADMIN", true)));

        dataInitializer.run();

        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).saveAndFlush(any(User.class));
    }

    @Test
    void runRejectsExistingNonAdminAccount() {
        configureBootstrap("strong-password");
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user("USER", true)));

        IllegalStateException error = assertThrows(IllegalStateException.class, () -> dataInitializer.run());

        assertEquals("管理员初始化失败：同名账号不是已启用管理员", error.getMessage());
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    void runRejectsExistingDisabledAdmin() {
        configureBootstrap("strong-password");
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user("ADMIN", false)));

        IllegalStateException error = assertThrows(IllegalStateException.class, () -> dataInitializer.run());

        assertEquals("管理员初始化失败：同名账号不是已启用管理员", error.getMessage());
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    void runAcceptsConcurrentCreationByAnotherInstance() throws Exception {
        configureBootstrap("strong-password");
        when(userRepository.findByUsername("admin"))
                .thenReturn(Optional.empty(), Optional.of(user("ADMIN", true)));
        when(passwordEncoder.encode("strong-password")).thenReturn("encoded-password");
        when(userRepository.saveAndFlush(any(User.class)))
                .thenThrow(new DataIntegrityViolationException("用户名唯一约束冲突"));

        dataInitializer.run();

        verify(userRepository, times(2)).findByUsername("admin");
        verify(userRepository).saveAndFlush(any(User.class));
    }

    @Test
    void runRethrowsConstraintFailureWithoutConcurrentAdmin() {
        configureBootstrap("strong-password");
        DataIntegrityViolationException failure = new DataIntegrityViolationException("非用户名约束失败");
        when(userRepository.findByUsername("admin")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("strong-password")).thenReturn("encoded-password");
        when(userRepository.saveAndFlush(any(User.class))).thenThrow(failure);

        DataIntegrityViolationException error = assertThrows(
                DataIntegrityViolationException.class,
                () -> dataInitializer.run()
        );

        assertSame(failure, error);
        verify(userRepository, times(2)).findByUsername("admin");
    }

    @Test
    void runRejectsConcurrentNonAdminAfterConstraintFailure() {
        configureBootstrap("strong-password");
        DataIntegrityViolationException failure = new DataIntegrityViolationException("用户名唯一约束冲突");
        when(userRepository.findByUsername("admin"))
                .thenReturn(Optional.empty(), Optional.of(user("USER", true)));
        when(passwordEncoder.encode("strong-password")).thenReturn("encoded-password");
        when(userRepository.saveAndFlush(any(User.class))).thenThrow(failure);

        IllegalStateException error = assertThrows(IllegalStateException.class, () -> dataInitializer.run());

        assertEquals("管理员初始化失败：同名账号不是已启用管理员", error.getMessage());
        assertSame(failure, error.getCause());
    }

    private void configureBootstrap(String password) {
        ReflectionTestUtils.setField(dataInitializer, "bootstrapEnabled", true);
        ReflectionTestUtils.setField(dataInitializer, "bootstrapUsername", "admin");
        ReflectionTestUtils.setField(dataInitializer, "bootstrapPassword", password);
    }

    private User user(String role, boolean enabled) {
        User user = new User();
        user.setRole(role);
        user.setEnabled(enabled);
        return user;
    }
}
