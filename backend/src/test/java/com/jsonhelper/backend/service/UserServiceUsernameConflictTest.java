package com.jsonhelper.backend.service;

import com.jsonhelper.backend.dto.RegisterRequest;
import com.jsonhelper.backend.dto.UpdateUserRequest;
import com.jsonhelper.backend.entity.User;
import com.jsonhelper.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.function.Executable;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceUsernameConflictTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, passwordEncoder);
    }

    @Test
    void createPreservesUsernameConstraintConflict() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("race-user");
        request.setPassword("secret");
        DataIntegrityViolationException conflict = usernameConflict();
        when(userRepository.existsByUsername("race-user")).thenReturn(false);
        when(passwordEncoder.encode("secret")).thenReturn("密码摘要");

        assertUsernameConflict(conflict, () -> userService.createUser(request));
    }

    @Test
    void updatePreservesUsernameConstraintConflict() {
        User user = new User();
        user.setId(1L);
        user.setUsername("old");
        UpdateUserRequest request = new UpdateUserRequest();
        request.setUsername("race-user");
        DataIntegrityViolationException conflict = usernameConflict();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.findByUsername("race-user")).thenReturn(Optional.empty());

        assertUsernameConflict(conflict, () -> userService.updateUser(1L, request));
    }

    private DataIntegrityViolationException usernameConflict() {
        DataIntegrityViolationException conflict = new DataIntegrityViolationException("用户名唯一约束冲突");
        when(userRepository.saveAndFlush(any(User.class))).thenThrow(conflict);
        return conflict;
    }

    private void assertUsernameConflict(DataIntegrityViolationException conflict, Executable action) {
        ResponseStatusException error = assertThrows(ResponseStatusException.class, action);

        assertTrue(error.getStatusCode().isSameCodeAs(HttpStatus.CONFLICT));
        assertEquals("用户名已被占用", error.getReason());
        assertSame(conflict, error.getCause());
    }
}
