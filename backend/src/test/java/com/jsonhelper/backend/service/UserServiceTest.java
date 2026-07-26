package com.jsonhelper.backend.service;

import com.jsonhelper.backend.dto.RegisterRequest;
import com.jsonhelper.backend.dto.UpdateUserRequest;
import com.jsonhelper.backend.entity.User;
import com.jsonhelper.backend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
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
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private UserService userService;
    private Locale originalLocale;

    @BeforeEach
    void setUp() {
        originalLocale = Locale.getDefault();
        userService = new UserService(userRepository, passwordEncoder);
    }

    @AfterEach
    void tearDown() {
        Locale.setDefault(originalLocale);
    }

    @Test
    void missingUserReturnsNotFound() {
        when(userRepository.findById(42L)).thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> userService.updateUser(42L, new UpdateUserRequest(null, null, null, null, null))
        );

        assertTrue(error.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND));
        assertEquals("用户不存在", error.getReason());
    }

    @Test
    void roleNormalizationDoesNotDependOnSystemLocale() {
        Locale.setDefault(Locale.forLanguageTag("tr-TR"));
        RegisterRequest request = new RegisterRequest("admin", "secret", "admin");
        when(passwordEncoder.encode("secret")).thenReturn("密码摘要");
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User created = userService.createUser(request);

        assertEquals("ADMIN", created.getRole());
    }

    @ParameterizedTest
    @ValueSource(strings = {"   ", "\u3000\u2003"})
    void blankUpdatePasswordDoesNotReplaceExistingHash(String password) {
        User user = new User();
        user.setId(1L);
        user.setPasswordHash("原密码摘要");
        UpdateUserRequest request = new UpdateUserRequest(null, null, password, null, null);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);
        User updated = userService.updateUser(1L, request);

        assertEquals("原密码摘要", updated.getPasswordHash());
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    void unicodeBlankKeywordUsesUnfilteredList() {
        userService.listUsers(0, 20, "\u3000\u2003");

        verify(userRepository).findAll(any(Pageable.class));
        verify(userRepository, never()).findByUsernameContaining(
                anyString(),
                any(Pageable.class)
        );
    }

}
