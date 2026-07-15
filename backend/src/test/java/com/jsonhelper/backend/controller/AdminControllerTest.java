package com.jsonhelper.backend.controller;

import com.jsonhelper.backend.common.exception.GlobalExceptionHandler;
import com.jsonhelper.backend.dto.RegisterRequest;
import com.jsonhelper.backend.dto.UpdateUserRequest;
import com.jsonhelper.backend.entity.User;
import com.jsonhelper.backend.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminControllerTest {

    private StubUserService userService;
    private LocalValidatorFactoryBean validator;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        userService = new StubUserService();
        validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders
                .standaloneSetup(new AdminController(userService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @AfterEach
    void tearDown() {
        validator.close();
    }

    @Test
    void userResponseDoesNotExposePasswordHash() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setUsername("admin-user");
        user.setPasswordHash("sensitive-password-hash");
        user.setRole("ADMIN");
        user.setEnabled(true);
        userService.createdUser = user;

        mockMvc.perform(post("/api/admin/users/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin-user\",\"password\":\"secret\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value("admin-user"))
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist())
                .andExpect(content().string(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString("sensitive-password-hash"))));
    }

    @Test
    void dataIntegrityConflictUsesStableResponse() throws Exception {
        userService.createFailure = new DataIntegrityViolationException("敏感数据库约束信息");

        mockMvc.perform(post("/api/admin/users/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"duplicate-user\",\"password\":\"secret\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(409))
                .andExpect(jsonPath("$.message").value("数据冲突，请检查后重试"))
                .andExpect(content().string(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString("敏感数据库约束信息"))));
    }

    @Test
    void malformedJsonUsesStableBadRequestResponse() throws Exception {
        mockMvc.perform(post("/api/admin/users/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("请求参数不合法"));
    }

    static Stream<String> invalidCreateBodies() {
        String oversizedValue = "a".repeat(256);
        return Stream.of(
                "{}",
                "{\"username\":\"   \",\"password\":\"secret\"}",
                "{\"username\":\"admin\",\"password\":\"\"}",
                "{\"username\":\"%s\",\"password\":\"secret\"}".formatted(oversizedValue),
                "{\"username\":\"admin\",\"password\":\"%s\"}".formatted(oversizedValue),
                "{\"username\":\"admin\",\"password\":\"secret\",\"role\":\"OWNER\"}",
                "{\"username\":\"admin\",\"password\":\"secret\",\"role\":\" ADMIN \"}"
        );
    }

    @ParameterizedTest
    @MethodSource("invalidCreateBodies")
    void invalidCreateBodyReturnsBadRequestBeforeService(String requestBody) throws Exception {
        mockMvc.perform(post("/api/admin/users/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("请求参数不合法"));

        assertEquals(0, userService.totalCallCount);
    }

    static Stream<String> invalidUpdateBodies() {
        String oversizedValue = "a".repeat(256);
        return Stream.of(
                "{\"username\":\"   \"}",
                "{\"username\":\"%s\"}".formatted(oversizedValue),
                "{\"email\":\"不是邮箱\"}",
                "{\"email\":\"%s@example.com\"}".formatted(oversizedValue),
                "{\"password\":\"%s\"}".formatted(oversizedValue),
                "{\"role\":\"OWNER\"}"
        );
    }

    @ParameterizedTest
    @MethodSource("invalidUpdateBodies")
    void invalidUpdateBodyReturnsBadRequestBeforeService(String requestBody) throws Exception {
        mockMvc.perform(put("/api/admin/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("请求参数不合法"));

        assertEquals(0, userService.totalCallCount);
    }

    static Stream<Arguments> invalidListQueries() {
        return Stream.of(
                Arguments.of("page", "-1"),
                Arguments.of("size", "0"),
                Arguments.of("size", "101"),
                Arguments.of("keyword", "a".repeat(256))
        );
    }

    @ParameterizedTest
    @MethodSource("invalidListQueries")
    void invalidListQueryReturnsBadRequestBeforeService(String parameter, String value) throws Exception {
        mockMvc.perform(get("/api/admin/users").param(parameter, value))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("请求参数不合法"));

        assertEquals(0, userService.totalCallCount);
    }

    @Test
    void maximumListBoundsReachService() throws Exception {
        String keyword = "a".repeat(255);
        userService.listedUsers = Page.empty(PageRequest.of(0, 100));

        mockMvc.perform(get("/api/admin/users")
                        .param("page", "0")
                        .param("size", "100")
                        .param("keyword", keyword))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        assertEquals(1, userService.listCallCount);
        assertEquals(0, userService.lastPage);
        assertEquals(100, userService.lastSize);
        assertEquals(keyword, userService.lastKeyword);
    }

    @Test
    void blankPasswordAndEmptyEmailRemainValidUpdateInputs() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setUsername("admin");
        userService.updatedUser = user;

        mockMvc.perform(put("/api/admin/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"\",\"password\":\"   \"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        assertEquals(1, userService.updateCallCount);
    }

    private static final class StubUserService extends UserService {
        private User createdUser;
        private User updatedUser;
        private Page<User> listedUsers = Page.empty(PageRequest.of(0, 10));
        private RuntimeException createFailure;
        private int totalCallCount;
        private int updateCallCount;
        private int listCallCount;
        private int lastPage;
        private int lastSize;
        private String lastKeyword;

        StubUserService() {
            super(null, null);
        }

        @Override
        public User createUser(RegisterRequest registerRequest) {
            totalCallCount += 1;
            if (createFailure != null) {
                throw createFailure;
            }
            return createdUser;
        }

        @Override
        public Page<User> listUsers(int page, int size, String keyword) {
            totalCallCount += 1;
            listCallCount += 1;
            lastPage = page;
            lastSize = size;
            lastKeyword = keyword;
            return listedUsers;
        }

        @Override
        public User updateUser(Long id, UpdateUserRequest request) {
            totalCallCount += 1;
            updateCallCount += 1;
            return updatedUser;
        }
    }
}
