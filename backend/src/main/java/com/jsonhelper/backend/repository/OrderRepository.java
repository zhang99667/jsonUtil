package com.jsonhelper.backend.repository;

import com.jsonhelper.backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNo(String orderNo);

    @org.springframework.data.jpa.repository.Query("SELECT SUM(o.amount) FROM Order o WHERE o.status = 'PAID'")
    java.math.BigDecimal sumPaidAmount();
}
