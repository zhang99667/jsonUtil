package com.jsonhelper.backend.service;

import com.jsonhelper.backend.entity.UploadFile;
import com.jsonhelper.backend.repository.UploadFileRepository;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileServiceStorageBoundaryTest {

    @TempDir
    Path tempDir;

    @Mock
    UploadFileRepository uploadFileRepository;

    private Path uploadRoot;
    private FileService fileService;

    @BeforeEach
    void setUp() throws IOException {
        uploadRoot = Files.createDirectory(tempDir.resolve("uploads"));
        fileService = new FileService(uploadFileRepository);
        ReflectionTestUtils.setField(fileService, "uploadDir", uploadRoot.toString());
        ReflectionTestUtils.setField(fileService, "maxUploadSize", 1024L);
        ReflectionTestUtils.setField(fileService, "maxPreviewSize", 1024L);
        ReflectionTestUtils.setField(fileService, "allowedExtensions", ".json");
        fileService.init();
        lenient().when(uploadFileRepository.save(any(UploadFile.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void saveFileDecouplesLongOriginalNameFromPhysicalName() throws IOException {
        String originalName = "a".repeat(214) + ".json";

        UploadFile savedFile = fileService.saveFile(jsonFile(originalName), "admin");

        Path storedPath = Path.of(savedFile.getStoragePath());
        assertEquals(originalName, savedFile.getFileName());
        assertTrue(Files.isRegularFile(storedPath));
        assertFalse(storedPath.getFileName().toString().endsWith(originalName));
        assertTrue(storedPath.getFileName().toString().getBytes(StandardCharsets.UTF_8).length < 255);
    }

    @Test
    void saveFilePreservesFiveHundredCodePointOriginalName() throws IOException {
        String originalName = "😀".repeat(495) + ".json";

        UploadFile savedFile = fileService.saveFile(jsonFile(originalName), "admin");

        assertEquals(500, savedFile.getFileName().codePointCount(0, savedFile.getFileName().length()));
        assertEquals(originalName, savedFile.getFileName());
        assertTrue(Files.isRegularFile(Path.of(savedFile.getStoragePath())));
    }

    @Test
    void saveFileRejectsNameBeyondDatabaseLimitWithoutSideEffects() throws IOException {
        String originalName = "😀".repeat(496) + ".json";

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> fileService.saveFile(jsonFile(originalName), "admin")
        );

        assertTrue(error.getStatusCode().isSameCodeAs(HttpStatus.BAD_REQUEST));
        assertEquals("文件名过长", error.getReason());
        assertUploadRootEmpty();
        verify(uploadFileRepository, never()).save(any(UploadFile.class));
    }

    @Test
    void saveFileCleansCreatedFileWhenMetadataLookupFails() throws IOException {
        IllegalStateException metadataFailure = new IllegalStateException("模拟元数据读取失败");
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(2L);
        when(file.getOriginalFilename()).thenReturn("payload.json");
        when(file.getContentType()).thenThrow(metadataFailure);

        RuntimeException error = assertThrows(
                RuntimeException.class,
                () -> fileService.saveFile(file, "admin")
        );

        assertSame(metadataFailure, error);
        assertUploadRootEmpty();
        verify(uploadFileRepository, never()).save(any(UploadFile.class));
    }

    @Test
    void getFileContentReadsFromPreopenedManagedStream() {
        UploadFile uploadFile = new UploadFile();
        uploadFile.setId(1L);
        uploadFile.setStoragePath("payload.json");
        when(uploadFileRepository.findById(1L)).thenReturn(Optional.of(uploadFile));
        ManagedUploadPathResolver uploadPaths = mock(ManagedUploadPathResolver.class);
        when(uploadPaths.openReadableFile("payload.json"))
                .thenReturn(new ByteArrayInputStream("中文".getBytes(StandardCharsets.UTF_8)));
        ReflectionTestUtils.setField(fileService, "uploadPaths", uploadPaths);

        String content = fileService.getFileContent(1L);

        assertEquals("中文", content);
        verify(uploadPaths).openReadableFile("payload.json");
        verify(uploadPaths, never()).requireReadableFile(any());
    }

    @Test
    void downloadResourceKeepsValidatedHandleAfterSymbolicLinkSwap() throws IOException {
        String expectedContent = "trusted-content";
        Path storedPath = Files.writeString(uploadRoot.resolve("payload.json"), expectedContent);
        Path outsideFile = Files.writeString(tempDir.resolve("outside.json"), "outside-secret!");
        verifySymbolicLinkSupport(outsideFile);
        stubUploadFile(storedPath);

        FileService.FileDownload download = fileService.getFileDownload(1L);
        replaceWithSymbolicLinkOrSkip(storedPath, outsideFile, download);

        try (InputStream inputStream = download.resource().getInputStream()) {
            assertEquals(expectedContent, new String(inputStream.readAllBytes(), StandardCharsets.UTF_8));
        }
    }

    private MockMultipartFile jsonFile(String originalName) {
        return new MockMultipartFile(
                "file",
                originalName,
                "application/json",
                "{}".getBytes(StandardCharsets.UTF_8)
        );
    }

    private void stubUploadFile(Path storedPath) {
        UploadFile uploadFile = new UploadFile();
        uploadFile.setId(1L);
        uploadFile.setFileName("payload.json");
        uploadFile.setStoragePath(storedPath.toString());
        when(uploadFileRepository.findById(1L)).thenReturn(Optional.of(uploadFile));
    }

    private void verifySymbolicLinkSupport(Path target) throws IOException {
        Path probe = uploadRoot.resolve("symbolic-link-probe");
        try {
            Files.createSymbolicLink(probe, target);
            Files.delete(probe);
        } catch (IOException | UnsupportedOperationException | SecurityException error) {
            Assumptions.assumeTrue(false, "当前环境不支持符号链接");
        }
    }

    private void replaceWithSymbolicLinkOrSkip(
            Path storedPath,
            Path outsideFile,
            FileService.FileDownload download
    ) throws IOException {
        try {
            Files.delete(storedPath);
            Files.createSymbolicLink(storedPath, outsideFile);
        } catch (IOException | UnsupportedOperationException | SecurityException error) {
            download.resource().getInputStream().close();
            Assumptions.assumeTrue(false, "当前环境不允许替换已打开的文件");
        }
    }

    private void assertUploadRootEmpty() throws IOException {
        try (Stream<Path> files = Files.list(uploadRoot)) {
            assertEquals(0L, files.count());
        }
    }
}
