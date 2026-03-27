package com.jsonhelper.backend.entity;

import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 上传文件实体
 */
@Data
@Entity
@Table(name = "upload_files")
public class UploadFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 文件名 */
    @Column(name = "file_name", nullable = false)
    private String fileName;

    /** 文件大小（字节） */
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /** 文件MIME类型 */
    @Column(name = "file_type")
    private String fileType;

    /** 文件存储路径 */
    @Column(name = "storage_path", nullable = false)
    private String storagePath;

    /** 上传者用户名 */
    @Column(nullable = false)
    private String uploader;

    /** 创建时间 */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
