package com.jsonhelper.backend.security;

import io.jsonwebtoken.MalformedJwtException;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterFailureTest {

    @Mock
    private JwtTokenProvider tokenProvider;
    @Mock
    private CustomUserDetailsService userDetailsService;
    @Mock
    private FilterChain filterChain;

    private JwtAuthenticationFilter authenticationFilter;

    @BeforeEach
    void setUp() {
        authenticationFilter = new JwtAuthenticationFilter(tokenProvider, userDetailsService);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void userLookupInfrastructureFailureStopsRequestChain() {
        DataAccessResourceFailureException failure = new DataAccessResourceFailureException("数据库不可用");
        when(tokenProvider.getUserUsernameFromJWT("valid-token")).thenReturn("enabled-user");
        when(userDetailsService.loadUserByUsername("enabled-user")).thenThrow(failure);

        DataAccessResourceFailureException thrown = assertThrows(
                DataAccessResourceFailureException.class,
                () -> authenticationFilter.doFilter(
                        request("Bearer valid-token"), new MockHttpServletResponse(), filterChain)
        );

        assertSame(failure, thrown);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verifyNoInteractions(filterChain);
    }

    @Test
    void invalidTokenRemainsAnonymousAndContinuesRequestChain() throws Exception {
        MockHttpServletRequest request = request("Bearer invalid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(tokenProvider.getUserUsernameFromJWT("invalid-token"))
                .thenThrow(new MalformedJwtException("测试用无效令牌"));

        authenticationFilter.doFilter(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(userDetailsService);
    }

    @Test
    void mixedCaseBearerSchemeCreatesAuthentication() throws Exception {
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername("enabled-user").password("密码摘要").authorities("ROLE_USER").build();
        MockHttpServletRequest request = request("bEaReR valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(tokenProvider.getUserUsernameFromJWT("valid-token")).thenReturn("enabled-user");
        when(userDetailsService.loadUserByUsername("enabled-user")).thenReturn(userDetails);

        authenticationFilter.doFilter(request, response, filterChain);

        verify(tokenProvider).getUserUsernameFromJWT("valid-token");
        verify(userDetailsService).loadUserByUsername("enabled-user");
        assertSame(userDetails, SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        verify(filterChain).doFilter(request, response);
    }

    private MockHttpServletRequest request(String authorization) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/users");
        request.addHeader("Authorization", authorization);
        return request;
    }
}
