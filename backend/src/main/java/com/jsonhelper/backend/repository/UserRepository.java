package com.jsonhelper.backend.repository;

import com.jsonhelper.backend.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    /**
     * 按固定顺序锁定已启用的指定角色用户，保护跨账号状态不变量
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<User> findByRoleAndEnabledTrueOrderById(String role);

    /**
     * 根据用户名模糊搜索（分页）
     */
    Page<User> findByUsernameContaining(String username, Pageable pageable);
}
