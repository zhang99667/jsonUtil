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
                    // Update password every restart to ensure it's always "1234"
                    user.setPasswordHash(passwordEncoder.encode(defaultPassword));
                    user.setEmail("markz@example.com");
                    user.setRole("ADMIN");
                    userRepository.save(user);
                    logger.info("Default user '{}' password has been reset to '{}'", defaultUsername, defaultPassword);
                },
                () -> {
                    // Create new user if not exists
                    User user = new User();
                    user.setUsername(defaultUsername);
                    user.setPasswordHash(passwordEncoder.encode(defaultPassword));
                    user.setEmail("markz@example.com");
                    user.setRole("ADMIN");
                    userRepository.save(user);
                    logger.info("Default user '{}' created with password '{}'", defaultUsername, defaultPassword);
                });
    }
}
