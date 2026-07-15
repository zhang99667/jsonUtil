package com.jsonhelper.backend.service;

import com.jsonhelper.backend.entity.UploadFile;
import com.jsonhelper.backend.repository.UploadFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 文件管理服务
 * 负责文件的上传、存储、读取和删除操作
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FileService {

    private static final String DEFAULT_ALLOWED_EXTENSIONS = ".conf,.config,.css,.csv,.env,.geojson,.har,.html,.ini,.java,.js,.json,.json5,.jsonc,.jsonl,.jsx,.log,.map,.md,.ndjson,.properties,.sql,.topojson,.toml,.ts,.tsx,.txt,.webmanifest,.xml,.yaml,.yml";
    private static final int MAX_ORIGINAL_FILE_NAME_CODE_POINTS = 500;

    private final UploadFileRepository uploadFileRepository;

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

    private ManagedUploadPathResolver uploadPaths;

    /**
     * 初始化上传目录，确保目录存在
     */
    @PostConstruct
    public void init() {
        previewReadLimit();
        try {
            uploadPaths = ManagedUploadPathResolver.initialize(uploadDir);
        } catch (IOException | InvalidPathException | SecurityException e) {
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "文件不存在，ID: " + id));
    }

    /**
     * 获取文件内容（以 UTF-8 字符串返回，用于预览）
     */
    public String getFileContent(Long id) {
        UploadFile uploadFile = getFileById(id);
        try (InputStream inputStream = requireUploadPaths().openReadableFile(uploadFile.getStoragePath())) {
            byte[] content = readPreviewBytes(inputStream);
            return StandardCharsets.UTF_8.newDecoder()
                    .decode(ByteBuffer.wrap(content))
                    .toString();
        } catch (CharacterCodingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "文件不是有效的 UTF-8 文本", e);
        } catch (IOException e) {
            throw new RuntimeException("读取文件内容失败", e);
        }
    }

    /**
     * 获取经过受管路径校验的下载资源与原始文件名
     */
    public FileDownload getFileDownload(Long id) {
        UploadFile uploadFile = getFileById(id);
        String fileName = sanitizeFileName(uploadFile.getFileName());
        InputStream inputStream = requireUploadPaths().openReadableFile(uploadFile.getStoragePath());
        return new FileDownload(fileName, new InputStreamResource(inputStream));
    }

    /**
     * 保存上传文件
     * 将文件写入磁盘并在数据库中创建记录
     */
    public UploadFile saveFile(MultipartFile file, String uploader) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "上传文件不能为空");
        }

        long fileSize = file.getSize();
        if (fileSize > maxUploadSize) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "上传文件超过大小限制");
        }

        String originalFileName = sanitizeFileName(file.getOriginalFilename());
        validateFileNameLength(originalFileName);
        validateExtension(originalFileName);
        String contentType = file.getContentType();

        Path targetPath = requireUploadPaths().createNewFile();
        UploadFile savedFile;
        try {
            UploadFile uploadFile = new UploadFile();
            uploadFile.setFileName(originalFileName);
            uploadFile.setFileSize(fileSize);
            uploadFile.setFileType(contentType != null ? contentType : "application/octet-stream");
            uploadFile.setStoragePath(targetPath.toString());
            uploadFile.setUploader(uploader);

            writeFileToDisk(file, targetPath);
            savedFile = uploadFileRepository.save(uploadFile);
        } catch (RuntimeException e) {
            rollbackStoredFile(targetPath, e);
            throw e;
        }
        log.info("文件已保存: {}", targetPath.toAbsolutePath());
        return savedFile;
    }

    /**
     * 写入当前调用预创建的临时文件，异常交由上层所有权范围统一回滚
     */
    private void writeFileToDisk(MultipartFile file, Path targetPath) {
        try (OutputStream outputStream = Files.newOutputStream(
                targetPath,
                StandardOpenOption.WRITE,
                StandardOpenOption.TRUNCATE_EXISTING,
                LinkOption.NOFOLLOW_LINKS
        )) {
            try (InputStream inputStream = file.getInputStream()) {
                inputStream.transferTo(outputStream);
            }
        } catch (IOException e) {
            throw new RuntimeException("保存文件到磁盘失败", e);
        }
    }

    /** 使用 JDK 有界读取已打开的预览流，避免文件并发增长时突破内存边界。 */
    private byte[] readPreviewBytes(InputStream inputStream) throws IOException {
        byte[] content = inputStream.readNBytes(previewReadLimit());
        if (content.length > maxPreviewSize) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "文件过大，暂不支持在线预览，请下载后查看"
            );
        }
        return content;
    }

    private int previewReadLimit() {
        if (maxPreviewSize < 0 || maxPreviewSize >= Integer.MAX_VALUE) {
            throw new IllegalStateException("文件预览大小上限必须在 0 到 2147483646 字节之间");
        }
        return Math.toIntExact(maxPreviewSize + 1);
    }

    /**
     * 尽力回滚磁盘副本，清理失败作为附加异常保留而不覆盖主异常
     */
    private void rollbackStoredFile(Path targetPath, Throwable primaryFailure) {
        try {
            Files.deleteIfExists(targetPath);
        } catch (IOException | SecurityException cleanupFailure) {
            primaryFailure.addSuppressed(cleanupFailure);
            log.error("回滚上传文件的磁盘副本失败", cleanupFailure);
        }
    }

    /**
     * 删除文件
     * 同时删除磁盘文件和数据库记录
     */
    public void deleteFile(Long id) {
        UploadFile uploadFile = getFileById(id);
        Path filePath = requireUploadPaths().resolveDeletionTarget(uploadFile.getStoragePath());
        try {
            if (Files.deleteIfExists(filePath)) {
                log.info("已删除磁盘文件: {}", filePath);
            } else {
                log.warn("磁盘文件不存在，仅删除数据库记录: {}", filePath);
            }
        } catch (IOException | SecurityException e) {
            log.error("删除磁盘文件失败", e);
            throw new RuntimeException("删除磁盘文件失败", e);
        }

        uploadFileRepository.deleteById(id);
        log.info("已删除文件记录，ID: {}", id);
    }

    private ManagedUploadPathResolver requireUploadPaths() {
        if (uploadPaths == null) {
            throw new IllegalStateException("文件上传目录尚未初始化");
        }
        return uploadPaths;
    }

    /** 下载资源及其面向用户的原始文件名 */
    public record FileDownload(String fileName, Resource resource) {
    }

    /**
     * 清理原始文件名，避免路径片段或控制字符进入展示名和下载响应头
     */
    private String sanitizeFileName(String originalFileName) {
        if (originalFileName == null || originalFileName.isBlank()) {
            return "unnamed.json";
        }

        String fileName = StringUtils.getFilename(StringUtils.cleanPath(originalFileName));
        if (fileName == null) {
            return "unnamed.json";
        }

        fileName = fileName
                .replace('\\', '_')
                .replace('/', '_')
                .replaceAll("[\\p{Cntrl}]", "")
                .trim();

        return fileName.isEmpty() ? "unnamed.json" : fileName;
    }

    /**
     * 按数据库字段契约校验展示文件名，不用文件系统字节上限冒充字符上限。
     */
    private void validateFileNameLength(String fileName) {
        if (fileName.codePointCount(0, fileName.length()) > MAX_ORIGINAL_FILE_NAME_CODE_POINTS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "文件名过长");
        }
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
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "不支持的文件类型: " + extension);
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
