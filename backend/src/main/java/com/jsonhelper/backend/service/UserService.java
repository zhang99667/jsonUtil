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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final String ADMIN_ROLE = "ADMIN";
    private static final String LAST_ENABLED_ADMIN_MESSAGE = "至少需要保留一个已启用的管理员";
    private static final Sort USER_LIST_SORT = Sort.by(
            Sort.Order.desc("createdAt"),
            Sort.Order.desc("id")
    );

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 创建新用户
     */
    public User createUser(RegisterRequest registerRequest) {
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "用户名已被占用");
        }

        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setPasswordHash(passwordEncoder.encode(registerRequest.getPassword()));
        user.setRole(registerRequest.getRole() != null
                ? registerRequest.getRole().toUpperCase(Locale.ROOT)
                : "USER");
        user.setEnabled(true);

        return userRepository.save(user);
    }

    /**
     * 分页查询用户列表，支持按用户名模糊搜索
     */
    public Page<User> listUsers(int page, int size, String keyword) {
        Pageable pageable = PageRequest.of(page, size, USER_LIST_SORT);
        if (keyword != null && !keyword.trim().isEmpty()) {
            return userRepository.findByUsernameContaining(keyword.trim(), pageable);
        }
        return userRepository.findAll(pageable);
    }

    /**
     * 更新用户信息
     */
    @Transactional
    public User updateUser(Long id, UpdateUserRequest request) {
        List<User> enabledAdmins = lockEnabledAdmins();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "用户不存在"));
        String nextRole = request.getRole() != null
                ? request.getRole().toUpperCase(Locale.ROOT)
                : user.getRole();
        Boolean nextEnabled = request.getEnabled() != null
                ? request.getEnabled()
                : user.getEnabled();
        ensureEnabledAdminRemains(user, isEnabledAdmin(nextRole, nextEnabled), enabledAdmins);

        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            // 检查用户名是否被其他人占用
            userRepository.findByUsername(request.getUsername()).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "用户名已被占用");
                }
            });
            user.setUsername(request.getUsername());
        }

        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getRole() != null) {
            user.setRole(nextRole);
        }

        if (request.getEnabled() != null) {
            user.setEnabled(request.getEnabled());
        }

        return userRepository.save(user);
    }

    /**
     * 删除用户
     */
    @Transactional
    public void deleteUser(Long id) {
        List<User> enabledAdmins = lockEnabledAdmins();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "用户不存在"));
        ensureEnabledAdminRemains(user, false, enabledAdmins);
        userRepository.delete(user);
    }

    /**
     * 切换用户启用/禁用状态
     */
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
}
