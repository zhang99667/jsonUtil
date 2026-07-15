package com.jsonhelper.backend.controller;

import com.jsonhelper.backend.common.exception.GlobalExceptionHandler;
import com.jsonhelper.backend.entity.UploadFile;
import com.jsonhelper.backend.service.FileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FileControllerTest {

    private static final String DOWNLOAD_FILE_NAME = "中文 空格\";100%.json";
    @TempDir
    Path tempDir;

    private Path uploadRoot;
    private StubFileService fileService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() throws IOException {
        uploadRoot = Files.createDirectory(tempDir.resolve("uploads"));
        fileService = new StubFileService(uploadRoot);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new FileController(fileService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void downloadMissingFileReturnsNotFound() throws Exception {
        stubUploadFile(uploadRoot.resolve("missing.json"));

        mockMvc.perform(get("/api/admin/files/1/download"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404))
                .andExpect(jsonPath("$.message").value("文件内容不存在"));
    }

    @Test
    void downloadDirectoryReturnsNotFound() throws Exception {
        Path directory = Files.createDirectory(uploadRoot.resolve("payload.json"));
        stubUploadFile(directory);

        mockMvc.perform(get("/api/admin/files/1/download"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404))
                .andExpect(jsonPath("$.message").value("文件内容不存在"));
    }

    @Test
    void downloadReadableFileReturnsStreamResponse() throws Exception {
        byte[] fileContent = "{\"ok\":true}".getBytes(StandardCharsets.UTF_8);
        Path storedPath = Files.write(uploadRoot.resolve("payload.json"), fileContent);
        stubUploadFile(storedPath);

        String contentDisposition = mockMvc.perform(get("/api/admin/files/1/download"))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        HttpHeaders.CONTENT_DISPOSITION,
                        containsString("filename=\"")
                ))
                .andExpect(header().string(
                        HttpHeaders.CONTENT_DISPOSITION,
                        containsString("filename*=UTF-8''")
                ))
                .andExpect(content().bytes(fileContent))
                .andReturn()
                .getResponse()
                .getHeader(HttpHeaders.CONTENT_DISPOSITION);

        assertEquals(DOWNLOAD_FILE_NAME, ContentDisposition.parse(contentDisposition).getFilename());
    }

    @Test
    void downloadFileOutsideUploadRootReturnsNotFound() throws Exception {
        Path outsideFile = Files.writeString(tempDir.resolve("outside.json"), "外部内容");
        stubUploadFile(outsideFile);

        mockMvc.perform(get("/api/admin/files/1/download"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));

        assertTrue(Files.exists(outsideFile));
    }

    @Test
    void downloadSymbolicLinkEscapingUploadRootReturnsNotFound() throws Exception {
        Path outsideFile = Files.writeString(tempDir.resolve("outside.json"), "外部内容");
        Path symbolicLink = createSymbolicLinkOrSkip(uploadRoot.resolve("payload.json"), outsideFile);
        stubUploadFile(symbolicLink);

        mockMvc.perform(get("/api/admin/files/1/download"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));

        assertTrue(Files.exists(outsideFile));
    }

    private void stubUploadFile(Path storedPath) {
        UploadFile uploadFile = new UploadFile();
        uploadFile.setId(1L);
        uploadFile.setFileName(DOWNLOAD_FILE_NAME);
        uploadFile.setStoragePath(storedPath.toString());
        fileService.setUploadFile(uploadFile);
    }

    private Path createSymbolicLinkOrSkip(Path link, Path target) {
        try {
            return Files.createSymbolicLink(link, target);
        } catch (IOException | UnsupportedOperationException | SecurityException error) {
            Assumptions.assumeTrue(false, "当前环境不支持符号链接");
            throw new AssertionError(error);
        }
    }

    private static final class StubFileService extends FileService {
        private UploadFile uploadFile;

        StubFileService(Path uploadRoot) {
            super(null);
            ReflectionTestUtils.setField(this, "uploadDir", uploadRoot.toString());
            init();
        }

        void setUploadFile(UploadFile uploadFile) {
            this.uploadFile = uploadFile;
        }

        @Override
        public UploadFile getFileById(Long id) {
            return uploadFile;
        }
    }
}
