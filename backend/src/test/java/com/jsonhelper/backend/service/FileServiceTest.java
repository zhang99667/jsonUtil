package com.jsonhelper.backend.service;

import com.jsonhelper.backend.entity.UploadFile;
import com.jsonhelper.backend.repository.UploadFileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class FileServiceTest {

    @TempDir
    Path uploadDir;

    @Mock
    UploadFileRepository uploadFileRepository;

    private FileService fileService;

    @BeforeEach
    void setUp() {
        fileService = new FileService();
        ReflectionTestUtils.setField(fileService, "uploadFileRepository", uploadFileRepository);
        ReflectionTestUtils.setField(fileService, "uploadDir", uploadDir.toString());
        ReflectionTestUtils.setField(fileService, "maxUploadSize", 20L);
        ReflectionTestUtils.setField(fileService, "maxPreviewSize", 10L);
        ReflectionTestUtils.setField(fileService, "allowedExtensions", ".json,.txt");
        lenient().when(uploadFileRepository.save(any(UploadFile.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void saveFileRejectsUnsupportedExtension() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "payload.exe",
                "application/octet-stream",
                "abc".getBytes()
        );

        assertThrows(IllegalArgumentException.class, () -> fileService.saveFile(file, "admin"));
    }

    @Test
    void saveFileRejectsOversizedFile() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "payload.json",
                "application/json",
                "012345678901234567890".getBytes()
        );

        assertThrows(IllegalArgumentException.class, () -> fileService.saveFile(file, "admin"));
    }

    @Test
    void saveFileSanitizesOriginalNameBeforeWriting() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "../payload.json",
                "application/json",
                "{\"ok\":true}".getBytes()
        );

        UploadFile saved = fileService.saveFile(file, "admin");

        assertTrue(saved.getStoragePath().startsWith(uploadDir.toString()));
        assertTrue(Files.exists(Path.of(saved.getStoragePath())));
    }
}
