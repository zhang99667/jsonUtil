package com.jsonhelper.backend.service;

import com.jsonhelper.backend.entity.UploadFile;
import com.jsonhelper.backend.repository.UploadFileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileServicePreviewReadTest {

    private static final String STORAGE_PATH = "payload.json";

    @Mock
    UploadFileRepository uploadFileRepository;

    @Mock
    ManagedUploadPathResolver uploadPaths;

    @TempDir
    Path uploadDir;

    private FileService fileService;

    @BeforeEach
    void setUp() {
        fileService = new FileService(uploadFileRepository);
        ReflectionTestUtils.setField(fileService, "uploadDir", uploadDir.toString());
        ReflectionTestUtils.setField(fileService, "maxPreviewSize", 10L);
        ReflectionTestUtils.setField(fileService, "uploadPaths", uploadPaths);
    }

    @Test
    void getFileContentAcceptsExactPreviewLimit() {
        String expectedContent = "0123456789";
        stubPreviewStream(new ByteArrayInputStream(
                expectedContent.getBytes(StandardCharsets.UTF_8)
        ));

        assertEquals(expectedContent, fileService.getFileContent(1L));
    }

    @Test
    void getFileContentConsumesOnlyLimitPlusOneByteBeforeRejectingGrowth() {
        AtomicInteger consumedBytes = new AtomicInteger();
        InputStream growingInputStream = new InputStream() {
            @Override
            public int read() {
                consumedBytes.incrementAndGet();
                return 'x';
            }

            @Override
            public int read(byte[] buffer, int offset, int length) {
                if (length == 0) {
                    return 0;
                }
                Arrays.fill(buffer, offset, offset + length, (byte) 'x');
                consumedBytes.addAndGet(length);
                return length;
            }
        };
        stubPreviewStream(growingInputStream);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> fileService.getFileContent(1L)
        );

        assertTrue(error.getStatusCode().isSameCodeAs(HttpStatus.BAD_REQUEST));
        assertEquals("文件过大，暂不支持在线预览，请下载后查看", error.getReason());
        assertEquals(11, consumedBytes.get());
    }

    @ParameterizedTest
    @ValueSource(longs = {-1L, 2147483647L})
    void initRejectsPreviewLimitOutsideJdkReadRange(long invalidLimit) {
        ReflectionTestUtils.setField(fileService, "maxPreviewSize", invalidLimit);

        IllegalStateException error = assertThrows(IllegalStateException.class, fileService::init);

        assertEquals("文件预览大小上限必须在 0 到 2147483646 字节之间", error.getMessage());
    }

    private void stubPreviewStream(InputStream inputStream) {
        UploadFile uploadFile = new UploadFile();
        uploadFile.setId(1L);
        uploadFile.setStoragePath(STORAGE_PATH);
        when(uploadFileRepository.findById(1L)).thenReturn(Optional.of(uploadFile));
        when(uploadPaths.openReadableFile(STORAGE_PATH)).thenReturn(inputStream);
    }
}
