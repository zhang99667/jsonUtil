package com.jsonhelper.backend.dto.response;

import com.jsonhelper.backend.entity.UploadFile;

import java.time.format.DateTimeFormatter;

public record FileItemDTO(
        Long id,
        String fileName,
        Long fileSize,
        String fileType,
        String uploadTime,
        String uploader
) {

    private static final DateTimeFormatter UPLOAD_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static FileItemDTO from(UploadFile file) {
        String uploadTime = file.getCreatedAt() == null
                ? ""
                : file.getCreatedAt().format(UPLOAD_TIME_FORMATTER);
        return new FileItemDTO(
                file.getId(),
                file.getFileName(),
                file.getFileSize(),
                file.getFileType(),
                uploadTime,
                file.getUploader()
        );
    }
}
