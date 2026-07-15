package com.jsonhelper.backend.service;

import com.jsonhelper.backend.entity.UploadFile;
import com.jsonhelper.backend.repository.UploadFileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileServiceTest {

    @TempDir
    Path uploadDir;

    @Mock
    UploadFileRepository uploadFileRepository;

    private FileService fileService;

    @BeforeEach
    void setUp() {
        fileService = new FileService(uploadFileRepository);
        ReflectionTestUtils.setField(fileService, "uploadDir", uploadDir.toString());
        ReflectionTestUtils.setField(fileService, "maxUploadSize", 20L);
        ReflectionTestUtils.setField(fileService, "maxPreviewSize", 10L);
        ReflectionTestUtils.setField(fileService, "allowedExtensions", ".json,.txt");
        fileService.init();
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

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> fileService.saveFile(file, "admin")
        );
        assertTrue(error.getStatusCode().isSameCodeAs(HttpStatus.BAD_REQUEST));
    }

    @Test
    void initRejectsBlankUploadDirectory() {
        ReflectionTestUtils.setField(fileService, "uploadDir", "  ");

        RuntimeException error = assertThrows(RuntimeException.class, fileService::init);

        assertTrue(error.getMessage().startsWith("无法创建文件上传目录"));
    }

    @Test
    void saveFileRejectsOversizedFile() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "payload.json",
                "application/json",
                "012345678901234567890".getBytes()
        );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> fileService.saveFile(file, "admin")
        );
        assertTrue(error.getStatusCode().isSameCodeAs(HttpStatus.BAD_REQUEST));
    }

    @Test
    void saveFileSanitizesOriginalNameBeforeWriting() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "../payload.json",
                "application/json",
                "{\"ok\":true}".getBytes()
        );

        UploadFile saved = fileService.saveFile(file, "admin");

        assertStoredInsideUploadRoot(saved);
    }

    @Test
    void saveFileAcceptsExtensionConfigWithoutLeadingDot() throws IOException {
        ReflectionTestUtils.setField(fileService, "allowedExtensions", "json,sql");
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "query.sql",
                "text/plain",
                "select 1".getBytes()
        );

        UploadFile saved = fileService.saveFile(file, "admin");

        assertStoredInsideUploadRoot(saved);
    }

    @Test
    void saveFileAcceptsCommonJsonFamilyDebugFiles() throws IOException {
        ReflectionTestUtils.setField(
                fileService,
                "allowedExtensions",
                ".json,.jsonl,.ndjson,.har,.geojson,.webmanifest,.map,.jsonc,.json5,.topojson"
        );

        for (String fileName : new String[] {
                "network.har",
                "events.ndjson",
                "city.geojson",
                "manifest.webmanifest",
                "bundle.map",
                "settings.jsonc",
                "sample.json5",
                "shape.topojson"
        }) {
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    fileName,
                    "application/octet-stream",
                    "{\"ok\":true}".getBytes()
            );

            UploadFile saved = fileService.saveFile(file, "admin");

            assertStoredInsideUploadRoot(saved);
        }
    }

    @Test
    void saveFileClosesUploadStreamAfterWriting() throws IOException {
        AtomicBoolean streamClosed = new AtomicBoolean();
        InputStream inputStream = new ByteArrayInputStream("{\"ok\":true}".getBytes()) {
            @Override
            public void close() throws IOException {
                streamClosed.set(true);
                super.close();
            }
        };
        MultipartFile file = mockMultipartFile(inputStream, 11L);

        fileService.saveFile(file, "admin");

        assertTrue(streamClosed.get());
    }

    @Test
    void saveFileDeletesDiskFileWhenDatabaseSaveFails() throws IOException {
        IllegalStateException databaseError = new IllegalStateException("模拟数据库写入失败");
        when(uploadFileRepository.save(any(UploadFile.class))).thenThrow(databaseError);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "payload.json",
                "application/json",
                "{\"ok\":true}".getBytes()
        );

        RuntimeException error = assertThrows(
                RuntimeException.class,
                () -> fileService.saveFile(file, "admin")
        );

        assertSame(databaseError, error);
        assertUploadDirectoryEmpty();
    }

    @Test
    void saveFileKeepsDatabaseErrorWhenDiskCleanupFails() {
        IllegalStateException databaseError = new IllegalStateException("模拟数据库写入失败");
        when(uploadFileRepository.save(any(UploadFile.class))).thenAnswer(invocation -> {
            UploadFile uploadFile = invocation.getArgument(0);
            Path storedPath = Path.of(uploadFile.getStoragePath());
            Files.delete(storedPath);
            Files.createDirectory(storedPath);
            Files.writeString(storedPath.resolve("占位文件.txt"), "阻止目录被直接删除");
            throw databaseError;
        });
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "payload.json",
                "application/json",
                "{\"ok\":true}".getBytes()
        );

        RuntimeException error = assertThrows(
                RuntimeException.class,
                () -> fileService.saveFile(file, "admin")
        );

        assertSame(databaseError, error);
        assertEquals(1, error.getSuppressed().length);
        assertTrue(error.getSuppressed()[0] instanceof IOException);
    }

    @Test
    void saveFileDeletesPartialDiskFileWhenReadingFails() throws IOException {
        AtomicBoolean streamClosed = new AtomicBoolean();
        IOException readFailure = new IOException("模拟上传流读取失败");
        InputStream brokenInputStream = new InputStream() {
            private int readCount;

            @Override
            public int read() throws IOException {
                if (readCount++ == 0) {
                    return '{';
                }
                throw readFailure;
            }

            @Override
            public void close() {
                streamClosed.set(true);
            }
        };
        MultipartFile file = mockMultipartFile(brokenInputStream, 2L);

        RuntimeException error = assertThrows(
                RuntimeException.class,
                () -> fileService.saveFile(file, "admin")
        );

        assertEquals("保存文件到磁盘失败", error.getMessage());
        assertSame(readFailure, error.getCause());
        assertTrue(streamClosed.get());
        assertUploadDirectoryEmpty();
        verify(uploadFileRepository, never()).save(any(UploadFile.class));
    }

    @Test
    void getFileContentRejectsDirectoryAsNotFound() throws IOException {
        Path storedPath = Files.createDirectory(uploadDir.resolve("payload.json"));
        stubUploadFile(storedPath);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> fileService.getFileContent(1L)
        );

        assertTrue(error.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND));
        assertEquals("文件内容不存在", error.getReason());
    }

    @Test
    void getFileContentRejectsMalformedUtf8AsBadRequest() throws IOException {
        Path storedPath = Files.write(
                uploadDir.resolve("payload.json"),
                new byte[] {(byte) 0xC3, 0x28}
        );
        stubUploadFile(storedPath);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> fileService.getFileContent(1L)
        );

        assertTrue(error.getStatusCode().isSameCodeAs(HttpStatus.BAD_REQUEST));
        assertEquals("文件不是有效的 UTF-8 文本", error.getReason());
    }

    @Test
    void getFileContentReadsUtf8Text() throws IOException {
        Path storedPath = Files.writeString(uploadDir.resolve("payload.json"), "中文");
        stubUploadFile(storedPath);

        String content = fileService.getFileContent(1L);

        assertEquals("中文", content);
    }

    @Test
    void getFileContentRejectsFileOutsideUploadRoot() throws IOException {
        configureNestedUploadRoot();
        Path outsideFile = Files.writeString(uploadDir.resolve("outside.json"), "x");
        stubUploadFile(outsideFile);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> fileService.getFileContent(1L)
        );

        assertTrue(error.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND));
        assertTrue(Files.exists(outsideFile));
    }

    @Test
    void getFileContentRejectsInvalidStoredPath() {
        stubUploadFile("\0");

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> fileService.getFileContent(1L)
        );

        assertTrue(error.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND));
        assertEquals("文件内容不存在", error.getReason());
    }

    @Test
    void getFileContentRejectsSymbolicLinkEscapingUploadRoot() throws IOException {
        Path uploadRoot = configureNestedUploadRoot();
        Path outsideFile = Files.writeString(uploadDir.resolve("outside.json"), "x");
        Path symbolicLink = createSymbolicLinkOrSkip(uploadRoot.resolve("payload.json"), outsideFile);
        stubUploadFile(symbolicLink);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> fileService.getFileContent(1L)
        );

        assertTrue(error.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND));
        assertTrue(Files.exists(outsideFile));
    }

    @Test
    void deleteFileRemovesDiskFileAndDatabaseRecord() throws IOException {
        Path storedPath = Files.writeString(uploadDir.resolve("payload.json"), "{\"ok\":true}");
        stubUploadFile(storedPath);

        fileService.deleteFile(1L);

        assertFalse(Files.exists(storedPath));
        verify(uploadFileRepository).deleteById(1L);
    }

    @Test
    void deleteFileRemovesDatabaseRecordWhenDiskFileIsMissing() {
        stubUploadFile(uploadDir.resolve("missing.json"));

        fileService.deleteFile(1L);

        verify(uploadFileRepository).deleteById(1L);
    }

    @Test
    void deleteFileRejectsFileOutsideUploadRoot() throws IOException {
        configureNestedUploadRoot();
        Path outsideFile = Files.writeString(uploadDir.resolve("outside.json"), "x");
        stubUploadFile(outsideFile);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> fileService.deleteFile(1L)
        );

        assertTrue(error.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND));
        assertTrue(Files.exists(outsideFile));
        verify(uploadFileRepository, never()).delete(any(UploadFile.class));
        verify(uploadFileRepository, never()).deleteById(1L);
    }

    @Test
    void deleteFileRejectsSymbolicLinkEscapingUploadRoot() throws IOException {
        Path uploadRoot = configureNestedUploadRoot();
        Path outsideFile = Files.writeString(uploadDir.resolve("outside.json"), "x");
        Path symbolicLink = createSymbolicLinkOrSkip(uploadRoot.resolve("payload.json"), outsideFile);
        stubUploadFile(symbolicLink);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> fileService.deleteFile(1L)
        );

        assertTrue(error.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND));
        assertTrue(Files.exists(outsideFile));
        assertTrue(Files.exists(symbolicLink, LinkOption.NOFOLLOW_LINKS));
        verify(uploadFileRepository, never()).delete(any(UploadFile.class));
        verify(uploadFileRepository, never()).deleteById(1L);
    }

    @Test
    void deleteFileRejectsEmptyDirectoryAndKeepsDatabaseRecord() throws IOException {
        Path storedPath = Files.createDirectory(uploadDir.resolve("payload.json"));
        stubUploadFile(storedPath);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> fileService.deleteFile(1L)
        );

        assertTrue(error.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND));
        assertTrue(Files.exists(storedPath));
        verify(uploadFileRepository, never()).deleteById(1L);
    }

    @Test
    void deleteFileRejectsDirectoryAndKeepsDatabaseRecord() throws IOException {
        Path storedPath = Files.createDirectory(uploadDir.resolve("payload.json"));
        Files.writeString(storedPath.resolve("占位文件.txt"), "阻止目录被直接删除");
        stubUploadFile(storedPath);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> fileService.deleteFile(1L)
        );

        assertTrue(error.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND));
        assertTrue(Files.exists(storedPath));
        verify(uploadFileRepository, never()).deleteById(1L);
    }

    @Test
    void deleteFileKeepsDatabaseRecordWhenUploadRootDisappears() throws IOException {
        Path missingFile = uploadDir.resolve("missing.json");
        stubUploadFile(missingFile);
        Files.delete(uploadDir);

        assertThrows(IllegalStateException.class, () -> fileService.deleteFile(1L));

        verify(uploadFileRepository, never()).deleteById(1L);
    }

    @Test
    void deleteFileConvergesWhenDatabaseDeleteIsRetried() throws IOException {
        Path storedPath = Files.writeString(uploadDir.resolve("payload.json"), "{\"ok\":true}");
        stubUploadFile(storedPath);
        IllegalStateException databaseError = new IllegalStateException("模拟数据库删除失败");
        doThrow(databaseError)
                .doNothing()
                .when(uploadFileRepository)
                .deleteById(1L);

        RuntimeException error = assertThrows(
                RuntimeException.class,
                () -> fileService.deleteFile(1L)
        );

        assertSame(databaseError, error);
        assertFalse(Files.exists(storedPath));

        fileService.deleteFile(1L);

        verify(uploadFileRepository, times(2)).deleteById(1L);
    }

    private void stubUploadFile(Path storedPath) {
        stubUploadFile(storedPath.toString());
    }

    private void stubUploadFile(String storagePath) {
        UploadFile uploadFile = new UploadFile();
        uploadFile.setId(1L);
        uploadFile.setStoragePath(storagePath);
        when(uploadFileRepository.findById(1L)).thenReturn(Optional.of(uploadFile));
    }

    private Path configureNestedUploadRoot() throws IOException {
        Path uploadRoot = Files.createDirectory(uploadDir.resolve("uploads"));
        ReflectionTestUtils.setField(fileService, "uploadDir", uploadRoot.toString());
        fileService.init();
        return uploadRoot;
    }

    private Path createSymbolicLinkOrSkip(Path link, Path target) {
        try {
            return Files.createSymbolicLink(link, target);
        } catch (IOException | UnsupportedOperationException | SecurityException error) {
            Assumptions.assumeTrue(false, "当前环境不支持符号链接");
            throw new AssertionError(error);
        }
    }

    private MultipartFile mockMultipartFile(InputStream inputStream, long size) throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(size);
        when(file.getOriginalFilename()).thenReturn("payload.json");
        when(file.getContentType()).thenReturn("application/json");
        when(file.getInputStream()).thenReturn(inputStream);
        return file;
    }

    private void assertStoredInsideUploadRoot(UploadFile uploadFile) throws IOException {
        Path storedPath = Path.of(uploadFile.getStoragePath());
        assertEquals(uploadDir.toRealPath(), storedPath.getParent());
        assertTrue(Files.exists(storedPath));
    }

    private void assertUploadDirectoryEmpty() throws IOException {
        try (Stream<Path> files = Files.list(uploadDir)) {
            assertEquals(0L, files.count());
        }
    }
}
