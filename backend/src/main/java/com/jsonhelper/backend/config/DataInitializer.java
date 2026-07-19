package com.jsonhelper.backend.config;

import com.jsonhelper.backend.entity.User;
import com.jsonhelper.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private static final String ADMIN_ROLE = "ADMIN";
    private static final String INVALID_EXISTING_ACCOUNT_MESSAGE = "管理员初始化失败：同名账号不是已启用管理员";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminBootstrapProperties bootstrapProperties;

    @Override
    public void run(String... args) throws Exception {
        if (!bootstrapProperties.isEnabled()) {
            log.info("管理员初始化未启用");
            return;
        }

        String username = bootstrapProperties.getUsername();
        String password = bootstrapProperties.getPassword();

        Optional<User> existingUser = userRepository.findByUsername(username);
        if (existingUser.isPresent()) {
            requireEnabledAdmin(existingUser.get());
            log.info("管理员初始化已跳过：已存在可用管理员");
            return;
        }

        // 直接依赖数据库唯一约束裁决多实例竞态，并立即刷新以在当前调用内暴露冲突。
        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setEmail(bootstrapProperties.getEmail());
        user.setRole(ADMIN_ROLE);
        user.setEnabled(true);
        try {
            userRepository.saveAndFlush(user);
            log.info("管理员初始化完成");
        } catch (DataIntegrityViolationException conflict) {
            Optional<User> concurrentUser = userRepository.findByUsername(username);
            if (concurrentUser.isEmpty()) {
                throw conflict;
            }
            if (!isEnabledAdmin(concurrentUser.get())) {
                throw new IllegalStateException(INVALID_EXISTING_ACCOUNT_MESSAGE, conflict);
            }
            log.info("管理员初始化已跳过：并发实例已完成初始化");
        }
    }

    private void requireEnabledAdmin(User user) {
        if (!isEnabledAdmin(user)) {
            throw new IllegalStateException(INVALID_EXISTING_ACCOUNT_MESSAGE);
        }
    }

    private boolean isEnabledAdmin(User user) {
        return ADMIN_ROLE.equals(user.getRole()) && Boolean.TRUE.equals(user.getEnabled());
    }
}
