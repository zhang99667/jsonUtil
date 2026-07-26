package com.jsonhelper.backend.service;

import com.jsonhelper.backend.config.FileProperties;
import com.jsonhelper.backend.entity.UploadFile;
import com.jsonhelper.backend.repository.UploadFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.nio.ByteBuffer;
import java.nio.channels.Channels;
import java.nio.channels.FileChannel;
import java.nio.channels.ReadableByteChannel;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Locale;

/**
 * 文件管理服务
 * 负责文件的上传、存储、读取和删除操作
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FileService {

    private static final int MAX_ORIGINAL_FILE_NAME_CODE_POINTS = 500;
    private static final Sort FILE_LIST_SORT = Sort.by(
            Sort.Order.desc("createdAt"),
            Sort.Order.desc("id")
    );

    private final UploadFileRepository uploadFileRepository;
    private final FileProperties fileProperties;

    private ManagedUploadPathResolver uploadPaths;

    /**
     * 初始化上传目录，确保目录存在
     */
    @PostConstruct
    public void init() {
        previewReadLimit();
        try {
            uploadPaths = ManagedUploadPathResolver.initialize(fileProperties.getUploadDir());
        } catch (IOException | InvalidPathException | SecurityException e) {
            throw new IllegalStateException("无法创建文件上传目录: " + fileProperties.getUploadDir(), e);
        }
    }

    /**
     * 分页查询文件列表，支持按文件名模糊搜索
     */
    public Page<UploadFile> listFiles(int page, int pageSize, String keyword) {
        int safePage = Math.max(page, 0);
        int safePageSize = Math.min(Math.max(pageSize, 1), 100);
        Pageable pageable = PageRequest.of(safePage, safePageSize, FILE_LIST_SORT);
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

        if (file.getSize() > fileProperties.getMaxUploadSize()) {
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
            uploadFile.setFileType(contentType != null ? contentType : "application/octet-stream");
            uploadFile.setStoragePath(targetPath.toString());
            uploadFile.setUploader(uploader);

            long actualFileSize = writeFileToDisk(file, targetPath);
            if (actualFileSize > fileProperties.getMaxUploadSize()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "上传文件超过大小限制");
            }
            uploadFile.setFileSize(actualFileSize);
            savedFile = uploadFileRepository.save(uploadFile);
        } catch (RuntimeException e) {
            rollbackStoredFile(targetPath, e);
            throw e;
        }
        log.info("文件已保存: {}", targetPath.toAbsolutePath());
        return savedFile;
    }

    /**
     * 在实际上传大小边界内写入预创建文件，返回真实写入字节数
     */
    private long writeFileToDisk(MultipartFile file, Path targetPath) {
        try (InputStream inputStream = file.getInputStream();
             ReadableByteChannel inputChannel = Channels.newChannel(inputStream);
             FileChannel outputChannel = FileChannel.open(
                targetPath,
                StandardOpenOption.WRITE,
                StandardOpenOption.TRUNCATE_EXISTING,
                LinkOption.NOFOLLOW_LINKS
        )) {
            long writtenBytes = 0;
            long readLimit = uploadReadLimit();
            while (writtenBytes < readLimit) {
                long transferredBytes = outputChannel.transferFrom(
                        inputChannel,
                        writtenBytes,
                        readLimit - writtenBytes
                );
                if (transferredBytes == 0) {
                    break;
                }
                writtenBytes += transferredBytes;
            }
            return writtenBytes;
        } catch (IOException e) {
            throw new RuntimeException("保存文件到磁盘失败", e);
        }
    }

    private long uploadReadLimit() {
        long maxUploadSize = fileProperties.getMaxUploadSize();
        return maxUploadSize == Long.MAX_VALUE ? Long.MAX_VALUE : maxUploadSize + 1;
    }

    /** 使用 JDK 有界读取已打开的预览流，避免文件并发增长时突破内存边界。 */
    private byte[] readPreviewBytes(InputStream inputStream) throws IOException {
        byte[] content = inputStream.readNBytes(previewReadLimit());
        if (content.length > fileProperties.getMaxPreviewSize()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "文件过大，暂不支持在线预览，请下载后查看"
            );
        }
        return content;
    }

    private int previewReadLimit() {
        long maxPreviewSize = fileProperties.getMaxPreviewSize();
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

        if (!fileProperties.getAllowedExtensions().contains(extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "不支持的文件类型: " + extension);
        }
    }
}
