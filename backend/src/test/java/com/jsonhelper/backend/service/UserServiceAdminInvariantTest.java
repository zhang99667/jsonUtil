package com.jsonhelper.backend.service;

import com.jsonhelper.backend.dto.UpdateUserRequest;
import com.jsonhelper.backend.entity.User;
import com.jsonhelper.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceAdminInvariantTest {

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
    void demotingOnlyEnabledAdminReturnsConflict() {
        User admin = enabledAdmin(1L);
        UpdateUserRequest request = new UpdateUserRequest();
        request.setRole("USER");
        prepareEnabledAdmins(admin);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> userService.updateUser(1L, request)
        );

        assertLastEnabledAdminConflict(error);
        assertLockPrecedesTargetLookup(1L);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void disablingOnlyEnabledAdminReturnsConflict() {
        User admin = enabledAdmin(1L);
        UpdateUserRequest request = new UpdateUserRequest();
        request.setEnabled(false);
        prepareEnabledAdmins(admin);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> userService.updateUser(1L, request)
        );

        assertLastEnabledAdminConflict(error);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void deletingOnlyEnabledAdminReturnsConflict() {
        User admin = enabledAdmin(1L);
        prepareEnabledAdmins(admin);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> userService.deleteUser(1L)
        );

        assertLastEnabledAdminConflict(error);
        assertLockPrecedesTargetLookup(1L);
        verify(userRepository, never()).delete(any(User.class));
    }

    @Test
    void togglingOnlyEnabledAdminOffReturnsConflict() {
        User admin = enabledAdmin(1L);
        prepareEnabledAdmins(admin);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> userService.toggleUserEnabled(1L)
        );

        assertLastEnabledAdminConflict(error);
        assertLockPrecedesTargetLookup(1L);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void demotingAdminSucceedsWhenAnotherEnabledAdminRemains() {
        User admin = enabledAdmin(1L);
        User otherAdmin = enabledAdmin(2L);
        UpdateUserRequest request = new UpdateUserRequest();
        request.setRole("USER");
        prepareEnabledAdmins(admin, otherAdmin);
        when(userRepository.save(admin)).thenReturn(admin);

        User updated = userService.updateUser(1L, request);

        assertEquals("USER", updated.getRole());
    }

    @Test
    void deletingAdminSucceedsWhenAnotherEnabledAdminRemains() {
        User admin = enabledAdmin(1L);
        User otherAdmin = enabledAdmin(2L);
        prepareEnabledAdmins(admin, otherAdmin);

        userService.deleteUser(1L);

        verify(userRepository).delete(admin);
    }

    @Test
    void deletingRegularUserDoesNotRequireAnEnabledAdmin() {
        User regularUser = new User();
        regularUser.setId(1L);
        regularUser.setRole("USER");
        regularUser.setEnabled(true);
        when(userRepository.findByRoleAndEnabledTrueOrderById("ADMIN")).thenReturn(List.of());
        when(userRepository.findById(1L)).thenReturn(Optional.of(regularUser));

        userService.deleteUser(1L);

        verify(userRepository).delete(regularUser);
    }

    private void prepareEnabledAdmins(User target, User... others) {
        List<User> enabledAdmins = new ArrayList<>();
        enabledAdmins.add(target);
        enabledAdmins.addAll(List.of(others));
        when(userRepository.findByRoleAndEnabledTrueOrderById("ADMIN")).thenReturn(enabledAdmins);
        when(userRepository.findById(target.getId())).thenReturn(Optional.of(target));
    }

    private User enabledAdmin(Long id) {
        User user = new User();
        user.setId(id);
        user.setRole("ADMIN");
        user.setEnabled(true);
        return user;
    }

    private void assertLockPrecedesTargetLookup(Long id) {
        InOrder order = inOrder(userRepository);
        order.verify(userRepository).findByRoleAndEnabledTrueOrderById("ADMIN");
        order.verify(userRepository).findById(id);
    }

    private void assertLastEnabledAdminConflict(ResponseStatusException error) {
        assertTrue(error.getStatusCode().isSameCodeAs(HttpStatus.CONFLICT));
        assertEquals("至少需要保留一个已启用的管理员", error.getReason());
    }
}
