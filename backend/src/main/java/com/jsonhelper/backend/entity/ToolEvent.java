package com.jsonhelper.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "tool_events", indexes = {
        @Index(name = "idx_tool_events_created_at", columnList = "created_at"),
        @Index(name = "idx_tool_events_event_name", columnList = "event_name"),
        @Index(name = "idx_tool_events_status", columnList = "status")
})
@Getter
@Setter
public class ToolEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_name", length = 64, nullable = false)
    private String eventName;

    @Column(length = 48, nullable = false)
    private String category;

    @Column(length = 24, nullable = false)
    private String status;

    @Column(name = "input_size_bucket", length = 24, nullable = false)
    private String inputSizeBucket;

    @Column(name = "duration_bucket", length = 24, nullable = false)
    private String durationBucket;

    @Column(length = 24, nullable = false)
    private String source;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
