package com.jsonhelper.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "visit_logs")
@Getter
@Setter
public class VisitLog {
    public static final int IP_MAX_LENGTH = 255;
    public static final int PATH_MAX_LENGTH = 255;
    public static final int METHOD_MAX_LENGTH = 255;
    public static final int USER_AGENT_MAX_LENGTH = 512;
    public static final int REFERER_MAX_LENGTH = 1024;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ip", length = IP_MAX_LENGTH)
    private String ip;

    @Column(name = "path", length = PATH_MAX_LENGTH)
    private String path;

    @Column(name = "method", length = METHOD_MAX_LENGTH)
    private String method;

    @Column(name = "user_agent", length = USER_AGENT_MAX_LENGTH)
    private String userAgent;

    @Column(name = "referer", length = REFERER_MAX_LENGTH)
    private String referer;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
