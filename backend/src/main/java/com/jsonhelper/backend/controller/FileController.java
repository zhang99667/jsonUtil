package com.jsonhelper.backend.controller;

import com.jsonhelper.backend.dto.response.FileItemDTO;
import com.jsonhelper.backend.dto.response.FileListDTO;
import com.jsonhelper.backend.dto.response.Result;
import com.jsonhelper.backend.entity.UploadFile;
import com.jsonhelper.backend.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/admin/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<FileListDTO> listFiles(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String keyword) {

        // 前端页码从 1 开始，Spring Data 页码从 0 开始。
        Page<UploadFile> filePage = fileService.listFiles(page - 1, pageSize, keyword);
        return Result.success(new FileListDTO(
                filePage.getContent().stream().map(FileItemDTO::from).toList(),
                filePage.getTotalElements()
        ));
    }

    @GetMapping("/{id}/content")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<String> getFileContent(@PathVariable Long id) {
        String content = fileService.getFileContent(id);
        return Result.success(content);
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        FileService.FileDownload download = fileService.getFileDownload(id);
        // Spring 6.1 的 UTF-8 兼容文件名会破坏特殊字符边界，因此只让它生成安全的 ASCII 参数。
        String contentDisposition = ContentDisposition.attachment()
                .filename("download")
                .build()
                + "; filename*=UTF-8''"
                + UriUtils.encode(download.fileName(), StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                .body(download.resource());
    }

    @PostMapping("/upload")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<FileItemDTO> uploadFile(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        String uploader = authentication.getName();
        UploadFile savedFile = fileService.saveFile(file, uploader);

        return Result.success(FileItemDTO.from(savedFile));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteFile(@PathVariable Long id) {
        fileService.deleteFile(id);
        return Result.success();
    }

}
