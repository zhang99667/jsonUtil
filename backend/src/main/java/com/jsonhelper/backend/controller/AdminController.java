package com.jsonhelper.backend.controller;

import com.jsonhelper.backend.dto.RegisterRequest;
import com.jsonhelper.backend.dto.UpdateUserRequest;
import com.jsonhelper.backend.dto.response.Result;
import com.jsonhelper.backend.entity.User;
import com.jsonhelper.backend.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;

    /**
     * 添加用户
     */
    @PostMapping("/users/add")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<User> addUser(@Valid @RequestBody RegisterRequest registerRequest) {
        return Result.success(userService.createUser(registerRequest));
    }

    /**
     * 分页获取用户列表，支持按用户名搜索
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Page<User>> listUsers(
            @RequestParam(defaultValue = "0")
            @Min(value = 0, message = "页码不能小于 0")
            int page,
            @RequestParam(defaultValue = "10")
            @Min(value = 1, message = "每页条数不能小于 1")
            @Max(value = 100, message = "每页条数不能超过 100")
            int size,
            @RequestParam(required = false)
            @Size(max = 255, message = "搜索关键词不能超过 255 个字符")
            String keyword) {
        return Result.success(userService.listUsers(page, size, keyword));
    }

    /**
     * 更新用户信息
     */
    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<User> updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
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
