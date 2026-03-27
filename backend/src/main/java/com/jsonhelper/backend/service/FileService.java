package com.jsonhelper.backend.service;

import com.jsonhelper.backend.entity.UploadFile;
import com.jsonhelper.backend.repository.UploadFileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * 文件管理服务
 * 负责文件的上传、存储、读取和删除操作
 */
@Service
public class FileService {

    private static final Logger logger = LoggerFactory.getLogger(FileService.class);

    @Autowired
    private UploadFileRepository uploadFileRepository;

    /** 文件上传目录，可通过配置文件修改 */
    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    /**
     * 初始化上传目录，确保目录存在
     */
    @PostConstruct
    public void init() {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                logger.info("创建文件上传目录: {}", uploadPath.toAbsolutePath());
            }
        } catch (IOException e) {
            throw new RuntimeException("无法创建文件上传目录: " + uploadDir, e);
        }
    }

    /**
     * 分页查询文件列表，支持按文件名模糊搜索
     */
    public Page<UploadFile> listFiles(int page, int pageSize, String keyword) {
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        if (keyword != null && !keyword.trim().isEmpty()) {
            return uploadFileRepository.findByFileNameContainingIgnoreCase(keyword.trim(), pageable);
        }
        return uploadFileRepository.findAll(pageable);
    }

    /**
     * 根据ID获取文件记录
     */
    public UploadFile getFileById(Long id) {
        return uploadFileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("文件不存在，ID: " + id));
    }

    /**
     * 获取文件内容（以 UTF-8 字符串返回，用于预览）
     */
    public String getFileContent(Long id) {
        UploadFile uploadFile = getFileById(id);
        Path filePath = Paths.get(uploadFile.getStoragePath());

        if (!Files.exists(filePath)) {
            throw new RuntimeException("文件不存在于磁盘: " + filePath);
        }

        try {
            return Files.readString(filePath, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("读取文件内容失败: " + e.getMessage(), e);
        }
    }

    /**
     * 保存上传文件
     * 将文件写入磁盘并在数据库中创建记录
     */
    public UploadFile saveFile(MultipartFile file, String uploader) {
        if (file.isEmpty()) {
            throw new RuntimeException("上传文件不能为空");
        }

        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null || originalFileName.isBlank()) {
            originalFileName = "unnamed";
        }

        // 生成唯一文件名，避免重名覆盖
        String uniqueFileName = UUID.randomUUID() + "_" + originalFileName;
        Path targetPath = Paths.get(uploadDir, uniqueFileName);

        try {
            Files.copy(file.getInputStream(), targetPath);
            logger.info("文件已保存到磁盘: {}", targetPath.toAbsolutePath());
        } catch (IOException e) {
            throw new RuntimeException("保存文件到磁盘失败: " + e.getMessage(), e);
        }

        // 创建数据库记录
        UploadFile uploadFile = new UploadFile();
        uploadFile.setFileName(originalFileName);
        uploadFile.setFileSize(file.getSize());
        uploadFile.setFileType(file.getContentType() != null ? file.getContentType() : "application/octet-stream");
        uploadFile.setStoragePath(targetPath.toString());
        uploadFile.setUploader(uploader);

        return uploadFileRepository.save(uploadFile);
    }

    /**
     * 删除文件
     * 同时删除磁盘文件和数据库记录
     */
    public void deleteFile(Long id) {
        UploadFile uploadFile = getFileById(id);

        // 删除磁盘上的文件
        Path filePath = Paths.get(uploadFile.getStoragePath());
        try {
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                logger.info("已删除磁盘文件: {}", filePath);
            } else {
                logger.warn("磁盘文件不存在，仅删除数据库记录: {}", filePath);
            }
        } catch (IOException e) {
            logger.error("删除磁盘文件失败: {}", filePath, e);
            // 即使磁盘文件删除失败，仍继续删除数据库记录
        }

        // 删除数据库记录
        uploadFileRepository.deleteById(id);
        logger.info("已删除文件记录，ID: {}", id);
    }
}
