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
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.UUID;

/**
 * 文件管理服务
 * 负责文件的上传、存储、读取和删除操作
 */
@Service
public class FileService {

    private static final Logger logger = LoggerFactory.getLogger(FileService.class);
    private static final String DEFAULT_ALLOWED_EXTENSIONS = ".conf,.config,.css,.csv,.env,.geojson,.har,.html,.ini,.java,.js,.json,.json5,.jsonc,.jsonl,.jsx,.log,.map,.md,.ndjson,.properties,.sql,.topojson,.toml,.ts,.tsx,.txt,.webmanifest,.xml,.yaml,.yml";

    @Autowired
    private UploadFileRepository uploadFileRepository;

    /** 文件上传目录，可通过配置文件修改 */
    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    /** 单文件上传大小上限，默认与 Spring Multipart 限制保持一致 */
    @Value("${file.max-upload-size:52428800}")
    private long maxUploadSize;

    /** 预览读取大小上限，避免大文件一次性读入内存 */
    @Value("${file.max-preview-size:2097152}")
    private long maxPreviewSize;

    /** 允许上传的文本类文件扩展名 */
    @Value("${file.allowed-extensions:" + DEFAULT_ALLOWED_EXTENSIONS + "}")
    private String allowedExtensions;

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
        int safePage = Math.max(page, 0);
        int safePageSize = Math.min(Math.max(pageSize, 1), 100);
        Pageable pageable = PageRequest.of(safePage, safePageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
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
            if (Files.size(filePath) > maxPreviewSize) {
                throw new IllegalArgumentException("文件过大，暂不支持在线预览，请下载后查看");
            }
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

        if (file.getSize() > maxUploadSize) {
            throw new IllegalArgumentException("上传文件超过大小限制");
        }

        String originalFileName = sanitizeFileName(file.getOriginalFilename());
        validateExtension(originalFileName);

        // 生成唯一文件名，避免重名覆盖
        String uniqueFileName = UUID.randomUUID() + "_" + originalFileName;
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path targetPath = uploadPath.resolve(uniqueFileName).normalize();

        if (!targetPath.startsWith(uploadPath)) {
            throw new IllegalArgumentException("非法文件名");
        }

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

    /**
     * 清理原始文件名，避免路径片段或控制字符进入存储路径
     */
    private String sanitizeFileName(String originalFileName) {
        if (originalFileName == null || originalFileName.isBlank()) {
            return "unnamed.json";
        }

        String fileName = Paths.get(originalFileName).getFileName().toString()
                .replace('\\', '_')
                .replace('/', '_')
                .replaceAll("[\\p{Cntrl}]", "")
                .trim();

        return fileName.isEmpty() ? "unnamed.json" : fileName;
    }

    /**
     * 校验上传文件扩展名，只允许文本和配置类文件进入管理后台
     */
    private void validateExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        String extension = dotIndex >= 0 ? fileName.substring(dotIndex).toLowerCase(Locale.ROOT) : "";

        Set<String> allowed = Arrays.stream(allowedExtensions.split(","))
                .map(this::normalizeExtension)
                .filter(item -> !item.isEmpty())
                .collect(Collectors.toSet());

        if (allowed.isEmpty() || !allowed.contains(extension)) {
            throw new IllegalArgumentException("不支持的文件类型: " + extension);
        }
    }

    /**
     * 兼容 ".json" 和 "json" 两种配置写法，降低环境变量配置出错概率
     */
    private String normalizeExtension(String extension) {
        String normalized = extension.trim().toLowerCase(Locale.ROOT);
        if (normalized.isEmpty() || normalized.startsWith(".")) {
            return normalized;
        }
        return "." + normalized;
    }
}
