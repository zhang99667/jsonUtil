package com.jsonhelper.backend.repository;

import com.jsonhelper.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    /**
     * 根据用户名模糊搜索（分页）
     */
    Page<User> findByUsernameContaining(String username, Pageable pageable);
}
