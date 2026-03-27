package com.jsonhelper.backend.config;

import com.jsonhelper.backend.entity.User;
import com.jsonhelper.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        String defaultUsername = "markz";
        String defaultPassword = "1234";

        userRepository.findByUsername(defaultUsername).ifPresentOrElse(
                user -> {
                    // 用户已存在，不重置密码，直接跳过
                    logger.info("Default user already exists");
                },
                () -> {
                    // 用户不存在时，创建默认用户
                    User user = new User();
                    user.setUsername(defaultUsername);
                    user.setPasswordHash(passwordEncoder.encode(defaultPassword));
                    user.setEmail("markz@example.com");
                    user.setRole("ADMIN");
                    userRepository.save(user);
                    logger.info("Default user created");
                });
    }
}
