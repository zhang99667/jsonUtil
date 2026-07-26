package com.jsonhelper.backend.service;

import com.jsonhelper.backend.dto.RegisterRequest;
import com.jsonhelper.backend.dto.UpdateUserRequest;
import com.jsonhelper.backend.entity.User;
import com.jsonhelper.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final String ADMIN_ROLE = "ADMIN";
    private static final String LAST_ENABLED_ADMIN_MESSAGE = "至少需要保留一个已启用的管理员";
    private static final String USERNAME_OCCUPIED_MESSAGE = "用户名已被占用";
    private static final Sort USER_LIST_SORT = Sort.by(
            Sort.Order.desc("createdAt"),
            Sort.Order.desc("id")
    );

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User createUser(RegisterRequest registerRequest) {
        String normalizedUsername = normalizeText(registerRequest.username());
        if (normalizedUsername == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "用户名不能为空");
        }
        if (userRepository.existsByUsername(normalizedUsername)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, USERNAME_OCCUPIED_MESSAGE);
        }

        User user = new User();
        user.setUsername(normalizedUsername);
        user.setPasswordHash(passwordEncoder.encode(registerRequest.password()));
        user.setRole(registerRequest.role() != null
                ? registerRequest.role().toUpperCase(Locale.ROOT)
                : "USER");
        user.setEnabled(true);

        return saveWithUsernameConflict(user);
    }

    public Page<User> listUsers(int page, int size, String keyword) {
        Pageable pageable = PageRequest.of(page, size, USER_LIST_SORT);
        String normalizedKeyword = normalizeText(keyword);
        if (normalizedKeyword != null) {
            return userRepository.findByUsernameContaining(normalizedKeyword, pageable);
        }
        return userRepository.findAll(pageable);
    }

    @Transactional
    public User updateUser(Long id, UpdateUserRequest request) {
        List<User> enabledAdmins = lockEnabledAdmins();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "用户不存在"));
        String nextRole = request.role() != null
                ? request.role().toUpperCase(Locale.ROOT)
                : user.getRole();
        Boolean nextEnabled = request.enabled() != null
                ? request.enabled()
                : user.getEnabled();
        ensureEnabledAdminRemains(user, isEnabledAdmin(nextRole, nextEnabled), enabledAdmins);

        String normalizedUsername = normalizeText(request.username());
        boolean usernameChanged = normalizedUsername != null && !normalizedUsername.equals(user.getUsername());
        if (usernameChanged) {
            // 检查用户名是否被其他人占用
            userRepository.findByUsername(normalizedUsername).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, USERNAME_OCCUPIED_MESSAGE);
                }
            });
            user.setUsername(normalizedUsername);
        }

        if (request.email() != null) {
            user.setEmail(request.email());
        }

        if (StringUtils.hasText(request.password())) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        if (request.role() != null) {
            user.setRole(nextRole);
        }

        if (request.enabled() != null) {
            user.setEnabled(request.enabled());
        }

        return usernameChanged ? saveWithUsernameConflict(user) : userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        List<User> enabledAdmins = lockEnabledAdmins();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "用户不存在"));
        ensureEnabledAdminRemains(user, false, enabledAdmins);
        userRepository.delete(user);
    }

    @Transactional
    public User toggleUserEnabled(Long id) {
        List<User> enabledAdmins = lockEnabledAdmins();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "用户不存在"));
        boolean nextEnabled = !Boolean.TRUE.equals(user.getEnabled());
        ensureEnabledAdminRemains(user, isEnabledAdmin(user.getRole(), nextEnabled), enabledAdmins);
        user.setEnabled(nextEnabled);
        return userRepository.save(user);
    }

    private List<User> lockEnabledAdmins() {
        // 固定锁顺序使并发降权、禁用或删除共享同一个串行化边界。
        return userRepository.findByRoleAndEnabledTrueOrderById(ADMIN_ROLE);
    }

    private User saveWithUsernameConflict(User user) {
        try {
            return userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException conflict) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, USERNAME_OCCUPIED_MESSAGE, conflict);
        }
    }

    private void ensureEnabledAdminRemains(
            User currentUser,
            boolean remainsEnabledAdmin,
            List<User> enabledAdmins
    ) {
        if (isEnabledAdmin(currentUser.getRole(), currentUser.getEnabled())
                && !remainsEnabledAdmin
                && enabledAdmins.size() <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, LAST_ENABLED_ADMIN_MESSAGE);
        }
    }

    private boolean isEnabledAdmin(String role, Boolean enabled) {
        return ADMIN_ROLE.equals(role) && Boolean.TRUE.equals(enabled);
    }

    private static String normalizeText(String value) {
        return StringUtils.hasText(value) ? value.strip() : null;
    }
}
