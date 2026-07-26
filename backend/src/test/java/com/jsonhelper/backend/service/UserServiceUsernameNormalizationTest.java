package com.jsonhelper.backend.service;

import com.jsonhelper.backend.dto.RegisterRequest;
import com.jsonhelper.backend.dto.UpdateUserRequest;
import com.jsonhelper.backend.entity.User;
import com.jsonhelper.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceUsernameNormalizationTest {

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
    void createRejectsUnicodeWhitespaceOnlyUsername() {
        RegisterRequest request = registerRequest("\u3000\u2003");

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> userService.createUser(request)
        );

        assertTrue(error.getStatusCode().isSameCodeAs(HttpStatus.BAD_REQUEST));
        assertEquals("用户名不能为空", error.getReason());
        verify(userRepository, never()).existsByUsername(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void createChecksConflictWithNormalizedUsername() {
        RegisterRequest request = registerRequest("\u3000existing-user\u2003");
        when(userRepository.existsByUsername("existing-user")).thenReturn(true);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> userService.createUser(request)
        );

        assertTrue(error.getStatusCode().isSameCodeAs(HttpStatus.CONFLICT));
        assertEquals("用户名已被占用", error.getReason());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void createSavesNormalizedUsername() {
        RegisterRequest request = registerRequest("\u3000new-user\u2003");
        when(passwordEncoder.encode("secret")).thenReturn("密码摘要");
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User created = userService.createUser(request);

        assertEquals("new-user", created.getUsername());
        verify(userRepository).existsByUsername("new-user");
    }

    @Test
    void updateUsesNormalizedUsernameForLookupAndSave() {
        User user = user(1L, "old-user");
        UpdateUserRequest request = updateRequest("\u3000new-user\u2003");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.saveAndFlush(user)).thenReturn(user);

        User updated = userService.updateUser(1L, request);

        assertEquals("new-user", updated.getUsername());
        verify(userRepository).findByUsername("new-user");
    }

    @Test
    void updateKeepsUsernameWhenNormalizedValueIsEmpty() {
        User user = user(1L, "existing-user");
        UpdateUserRequest request = updateRequest("\u3000\u2003");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        User updated = userService.updateUser(1L, request);

        assertEquals("existing-user", updated.getUsername());
        verify(userRepository, never()).findByUsername(anyString());
    }

    @Test
    void updateRejectsConflictFoundWithNormalizedUsername() {
        User user = user(1L, "old-user");
        User existingUser = user(2L, "existing-user");
        UpdateUserRequest request = updateRequest("\u3000existing-user\u2003");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.findByUsername("existing-user")).thenReturn(Optional.of(existingUser));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> userService.updateUser(1L, request)
        );

        assertTrue(error.getStatusCode().isSameCodeAs(HttpStatus.CONFLICT));
        assertEquals("用户名已被占用", error.getReason());
        verify(userRepository, never()).save(any(User.class));
    }

    private RegisterRequest registerRequest(String username) {
        return new RegisterRequest(username, "secret", null);
    }

    private UpdateUserRequest updateRequest(String username) {
        return new UpdateUserRequest(username, null, null, null, null);
    }

    private User user(Long id, String username) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        return user;
    }
}
