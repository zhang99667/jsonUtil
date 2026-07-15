package com.jsonhelper.backend.security;

import com.jsonhelper.backend.config.JwtProperties;
import com.jsonhelper.backend.dto.LoginRequest;
import com.jsonhelper.backend.entity.User;
import com.jsonhelper.backend.repository.UserRepository;
import com.jsonhelper.backend.service.AuthService;
import io.jsonwebtoken.MalformedJwtException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.Duration;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountStatusAuthenticationTest {

    @Mock
    private UserRepository userRepository;

    private CustomUserDetailsService userDetailsService;
    private FixedJwtTokenProvider tokenProvider;
    private JwtAuthenticationFilter authenticationFilter;

    @BeforeEach
    void setUp() {
        userDetailsService = new CustomUserDetailsService(userRepository);
        tokenProvider = new FixedJwtTokenProvider();
        authenticationFilter = new JwtAuthenticationFilter(tokenProvider, userDetailsService);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void disabledUserCannotCreateJwtAuthentication() throws Exception {
        User user = createUser(false);
        when(userRepository.findByUsername("disabled-user")).thenReturn(Optional.of(user));
        tokenProvider.setUsername("disabled-user");

        assertFalse(userDetailsService.loadUserByUsername("disabled-user").isEnabled());

        MockFilterChain filterChain = runFilter();

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        assertNotNull(filterChain.getRequest());
    }

    @Test
    void enabledUserCanCreateJwtAuthentication() throws Exception {
        User user = createUser(true);
        when(userRepository.findByUsername("enabled-user")).thenReturn(Optional.of(user));
        tokenProvider.setUsername("enabled-user");

        assertTrue(userDetailsService.loadUserByUsername("enabled-user").isEnabled());

        MockFilterChain filterChain = runFilter();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        assertNotNull(authentication);
        assertTrue(authentication.isAuthenticated());
        assertNotNull(filterChain.getRequest());
    }

    @Test
    void disabledUserCannotLoginThroughAuthenticationManager() {
        String password = "correct-password";
        BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        User user = createUser(false);
        user.setPasswordHash(passwordEncoder.encode(password));
        when(userRepository.findByUsername("disabled-user")).thenReturn(Optional.of(user));

        DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider();
        authenticationProvider.setUserDetailsService(userDetailsService);
        authenticationProvider.setPasswordEncoder(passwordEncoder);
        AuthService authService = new AuthService(
                new ProviderManager(authenticationProvider),
                tokenProvider
        );
        LoginRequest request = new LoginRequest();
        request.setUsername("disabled-user");
        request.setPassword(password);

        assertThrows(DisabledException.class, () -> authService.login(request));
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    private MockFilterChain runFilter() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/users");
        request.addHeader("Authorization", "Bearer valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        authenticationFilter.doFilter(request, response, filterChain);

        return filterChain;
    }

    private User createUser(boolean enabled) {
        User user = new User();
        user.setUsername(enabled ? "enabled-user" : "disabled-user");
        user.setPasswordHash("encoded-password");
        user.setRole("USER");
        user.setEnabled(enabled);
        return user;
    }

    private static final class FixedJwtTokenProvider extends JwtTokenProvider {
        private String username;

        private FixedJwtTokenProvider() {
            super(new JwtProperties("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789AB", Duration.ofDays(1)));
        }

        void setUsername(String username) {
            this.username = username;
        }

        @Override
        public String getUserUsernameFromJWT(String token) {
            if (!"valid-token".equals(token)) {
                throw new MalformedJwtException("测试用无效令牌");
            }
            return username;
        }
    }
}
