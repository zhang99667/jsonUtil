package com.jsonhelper.backend.controller;

import com.jsonhelper.backend.dto.RegisterRequest;
import com.jsonhelper.backend.dto.UpdateUserRequest;
import com.jsonhelper.backend.dto.response.Result;
import com.jsonhelper.backend.entity.User;
import com.jsonhelper.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserService userService;

    /**
     * 添加用户
     */
    @PostMapping("/users/add")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<User> addUser(@RequestBody RegisterRequest registerRequest) {
        return Result.success(userService.createUser(registerRequest));
    }

    /**
     * 分页获取用户列表，支持按用户名搜索
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Page<User>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return Result.success(userService.listUsers(page, size, keyword));
    }

    /**
     * 更新用户信息
     */
    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<User> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        return Result.success(userService.updateUser(id, request));
    }

    /**
     * 删除用户
     */
    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return Result.success();
    }

    /**
     * 切换用户启用/禁用状态
     */
    @PutMapping("/users/{id}/toggle-enabled")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<User> toggleUserEnabled(@PathVariable Long id) {
        return Result.success(userService.toggleUserEnabled(id));
    }
}
