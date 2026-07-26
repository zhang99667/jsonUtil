package com.jsonhelper.backend.service;

import com.jsonhelper.backend.config.FileProperties;
import com.jsonhelper.backend.entity.UploadFile;
import com.jsonhelper.backend.repository.UploadFileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class FileServiceUploadStreamTest {

    @TempDir
    Path tempDir;

    @Mock
    UploadFileRepository uploadFileRepository;

    private Path uploadRoot;
    private FileService fileService;

    @BeforeEach
    void setUp() throws IOException {
        uploadRoot = Files.createDirectory(tempDir.resolve("uploads"));
        fileService = new FileService(
                uploadFileRepository,
                new FileProperties(uploadRoot.toString(), 1024L, 1024L, ".json")
        );
        fileService.init();
        lenient().when(uploadFileRepository.save(any(UploadFile.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void saveFileContinuesAfterTransientZeroLengthRead() throws IOException {
        byte[] content = "{\"ok\":true}".getBytes();
        InputStream inputStream = new ByteArrayInputStream(content) {
            private boolean firstBulkRead = true;

            @Override
            public synchronized int read(byte[] buffer, int offset, int length) {
                if (firstBulkRead) {
                    firstBulkRead = false;
                    return 0;
                }
                return super.read(buffer, offset, length);
            }
        };

        UploadFile savedFile = fileService.saveFile(jsonFile(inputStream, 1L, content), "admin");

        assertEquals(content.length, savedFile.getFileSize());
        assertArrayEquals(content, Files.readAllBytes(Path.of(savedFile.getStoragePath())));
    }

    @Test
    void saveFileRejectsActualStreamBeyondLimitAndRollsBack() throws IOException {
        byte[] content = new byte[1026];
        ByteArrayInputStream inputStream = new ByteArrayInputStream(content);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> fileService.saveFile(jsonFile(inputStream, 1L, content), "admin")
        );

        assertTrue(error.getStatusCode().isSameCodeAs(HttpStatus.BAD_REQUEST));
        assertEquals("上传文件超过大小限制", error.getReason());
        assertEquals(1, inputStream.available());
        assertUploadRootEmpty();
        verify(uploadFileRepository, never()).save(any(UploadFile.class));
    }

    private MockMultipartFile jsonFile(
            InputStream inputStream,
            long reportedSize,
            byte[] content
    ) {
        return new MockMultipartFile("file", "payload.json", "application/json", content) {
            @Override
            public long getSize() {
                return reportedSize;
            }

            @Override
            public InputStream getInputStream() {
                return inputStream;
            }
        };
    }

    private void assertUploadRootEmpty() throws IOException {
        try (Stream<Path> files = Files.list(uploadRoot)) {
            assertEquals(0L, files.count());
        }
    }
}
