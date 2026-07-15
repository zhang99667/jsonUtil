package com.jsonhelper.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.LinkOption;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.BasicFileAttributes;

/**
 * 统一约束上传根目录与数据库存储路径，避免各调用入口重复实现边界检查。
 */
final class ManagedUploadPathResolver {

    private final Path uploadRoot;

    private ManagedUploadPathResolver(Path uploadRoot) {
        this.uploadRoot = uploadRoot;
    }

    static ManagedUploadPathResolver initialize(String uploadDir) throws IOException {
        if (uploadDir == null || uploadDir.isBlank()) {
            throw new IOException("文件上传目录不能为空");
        }
        Path configuredRoot = Path.of(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(configuredRoot);
        Path realRoot = configuredRoot.toRealPath();
        if (!Files.isDirectory(realRoot, LinkOption.NOFOLLOW_LINKS)) {
            throw new IOException("文件上传路径不是目录");
        }
        return new ManagedUploadPathResolver(realRoot);
    }

    /** 在受管根目录中原子创建固定短物理名，不让用户文件名进入存储路径。 */
    Path createNewFile() {
        try {
            return Files.createTempFile(requireAvailableRoot(), "upload-", null);
        } catch (IOException | SecurityException e) {
            throw new IllegalStateException("创建上传文件失败", e);
        }
    }

    Path requireReadableFile(String storagePath) {
        Path filePath = resolveManagedPath(storagePath);
        if (!isRegularFileOrMissing(filePath) || !Files.isReadable(filePath)) {
            throw fileContentNotFound();
        }
        return filePath;
    }

    /** 校验后立即打开文件句柄，防止响应写出时再次按路径跟随符号链接。 */
    InputStream openReadableFile(String storagePath) {
        Path filePath = requireReadableFile(storagePath);
        try {
            return Files.newInputStream(
                    filePath,
                    StandardOpenOption.READ,
                    LinkOption.NOFOLLOW_LINKS
            );
        } catch (IOException | SecurityException | UnsupportedOperationException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "文件内容不存在", e);
        }
    }

    Path resolveDeletionTarget(String storagePath) {
        Path filePath = resolveManagedPath(storagePath);
        isRegularFileOrMissing(filePath);
        return filePath;
    }

    private Path resolveManagedPath(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            throw fileContentNotFound();
        }

        Path root = requireAvailableRoot();
        try {
            Path candidate = Path.of(storagePath);
            if (!candidate.isAbsolute()) {
                candidate = root.resolve(candidate);
            }
            candidate = candidate.toAbsolutePath().normalize();
            Path parent = candidate.getParent();
            Path fileName = candidate.getFileName();
            if (parent == null || fileName == null || !parent.toRealPath().equals(root)) {
                throw fileContentNotFound();
            }
            return root.resolve(fileName);
        } catch (IOException | InvalidPathException | SecurityException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "文件内容不存在", e);
        }
    }

    private boolean isRegularFileOrMissing(Path filePath) {
        try {
            BasicFileAttributes attributes = Files.readAttributes(
                    filePath,
                    BasicFileAttributes.class,
                    LinkOption.NOFOLLOW_LINKS
            );
            if (!attributes.isRegularFile()) {
                throw fileContentNotFound();
            }
            if (!uploadRoot.equals(filePath.toRealPath().getParent())) {
                throw fileContentNotFound();
            }
            return true;
        } catch (NoSuchFileException e) {
            return false;
        } catch (IOException | SecurityException e) {
            throw new IllegalStateException("检查文件存储状态失败", e);
        }
    }

    private Path requireAvailableRoot() {
        try {
            if (!uploadRoot.equals(uploadRoot.toRealPath())
                    || !Files.isDirectory(uploadRoot, LinkOption.NOFOLLOW_LINKS)) {
                throw new IllegalStateException("文件上传目录不可用");
            }
            return uploadRoot;
        } catch (IOException | SecurityException e) {
            throw new IllegalStateException("文件上传目录不可用", e);
        }
    }

    private ResponseStatusException fileContentNotFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "文件内容不存在");
    }
}
