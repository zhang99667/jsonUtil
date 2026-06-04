package com.jsonhelper.backend.config;

import com.jsonhelper.backend.entity.User;
import com.jsonhelper.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

    /** 是否允许通过环境变量创建首个管理员账号 */
    @Value("${admin.bootstrap.enabled:false}")
    private boolean bootstrapEnabled;

    @Value("${admin.bootstrap.username:}")
    private String bootstrapUsername;

    @Value("${admin.bootstrap.password:}")
    private String bootstrapPassword;

    @Value("${admin.bootstrap.email:admin@example.com}")
    private String bootstrapEmail;

    @Override
    public void run(String... args) throws Exception {
        if (!bootstrapEnabled) {
            logger.info("Admin bootstrap is disabled");
            return;
        }

        String username = bootstrapUsername == null ? "" : bootstrapUsername.trim();
        String password = bootstrapPassword == null ? "" : bootstrapPassword.trim();

        if (username.isEmpty() || password.isEmpty()) {
            throw new IllegalStateException("已启用管理员初始化，但 ADMIN_BOOTSTRAP_USERNAME 或 ADMIN_BOOTSTRAP_PASSWORD 未配置");
        }

        if (password.length() < 8 || password.startsWith("change-me")) {
            throw new IllegalStateException("管理员初始化密码不符合要求，请配置至少 8 位且非示例值的 ADMIN_BOOTSTRAP_PASSWORD");
        }

        userRepository.findByUsername(username).ifPresentOrElse(
                user -> {
                    // 用户已存在，不重置密码，直接跳过
                    logger.info("Bootstrap admin user already exists");
                },
                () -> {
                    // 用户不存在时，按显式配置创建管理员，避免默认口令进入生产环境
                    User user = new User();
                    user.setUsername(username);
                    user.setPasswordHash(passwordEncoder.encode(password));
                    user.setEmail(bootstrapEmail);
                    user.setRole("ADMIN");
                    userRepository.save(user);
                    logger.info("Bootstrap admin user created");
                });
    }
}
