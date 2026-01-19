package com.jsonhelper.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "visit_logs")
@Data
public class VisitLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ip;
    private String path;
    private String method;
    
    @Column(name = "user_agent", length = 512)
    private String userAgent;
    
    @Column(name = "referer", length = 1024)
    private String referer;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
