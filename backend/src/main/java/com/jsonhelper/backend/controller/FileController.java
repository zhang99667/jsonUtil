package com.jsonhelper.backend.controller;

import com.jsonhelper.backend.dto.response.Result;
import com.jsonhelper.backend.entity.UploadFile;
import com.jsonhelper.backend.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 文件管理控制器
 * 提供文件列表查询、预览、上传、下载和删除接口
 */
@RestController
@RequestMapping("/api/admin/files")
public class FileController {

    @Autowired
    private FileService fileService;

    /** 日期格式化器，用于将 LocalDateTime 格式化为前端期望的字符串 */
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 获取文件列表（分页 + 搜索）
     * 前端传入 page 从 1 开始，需要转换为 Spring 的 0-indexed
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Map<String, Object>> listFiles(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String keyword) {

        // 前端页码从1开始，Spring Data 从0开始
        Page<UploadFile> filePage = fileService.listFiles(page - 1, pageSize, keyword);

        // 转换为前端期望的 FileItem 格式
        List<Map<String, Object>> list = filePage.getContent().stream()
                .map(this::toFileItemMap)
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("list", list);
        result.put("total", filePage.getTotalElements());

        return Result.success(result);
    }

    /**
     * 获取文件内容（用于预览）
     */
    @GetMapping("/{id}/content")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<String> getFileContent(@PathVariable Long id) {
        String content = fileService.getFileContent(id);
        return Result.success(content);
    }

    /**
     * 下载文件
     */
    @GetMapping("/{id}/download")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        UploadFile uploadFile = fileService.getFileById(id);
        Path filePath = Paths.get(uploadFile.getStoragePath());
        Resource resource = new PathResource(filePath);

        // 对文件名进行 URL 编码，支持中文文件名
        String encodedFileName = URLEncoder.encode(uploadFile.getFileName(), StandardCharsets.UTF_8)
                .replace("+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename*=UTF-8''" + encodedFileName)
                .body(resource);
    }

    /**
     * 上传文件
     */
    @PostMapping("/upload")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Map<String, Object>> uploadFile(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        String uploader = authentication.getName();
        UploadFile savedFile = fileService.saveFile(file, uploader);

        return Result.success(toFileItemMap(savedFile));
    }

    /**
     * 删除文件
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteFile(@PathVariable Long id) {
        fileService.deleteFile(id);
        return Result.success();
    }

    /**
     * 将 UploadFile 实体转换为前端期望的 FileItem Map
     * 字段映射: createdAt -> uploadTime
     */
    private Map<String, Object> toFileItemMap(UploadFile file) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", file.getId());
        map.put("fileName", file.getFileName());
        map.put("fileSize", file.getFileSize());
        map.put("fileType", file.getFileType());
        map.put("uploadTime", file.getCreatedAt() != null ? file.getCreatedAt().format(DATE_FORMATTER) : "");
        map.put("uploader", file.getUploader());
        return map;
    }
}
