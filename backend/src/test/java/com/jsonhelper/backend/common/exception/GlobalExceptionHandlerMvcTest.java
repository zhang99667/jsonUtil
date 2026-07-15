package com.jsonhelper.backend.common.exception;

import com.jsonhelper.backend.controller.FileController;
import com.jsonhelper.backend.dto.response.Result;
import com.jsonhelper.backend.entity.UploadFile;
import com.jsonhelper.backend.service.FileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerMvcTest {

    private FileService fileService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        fileService = new UploadLimitFileService();
        mockMvc = MockMvcBuilders
                .standaloneSetup(new FileController(fileService), new JsonOnlyController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void missingMultipartFileReturnsBadRequest() throws Exception {
        mockMvc.perform(multipart("/api/admin/files/upload").principal(adminAuthentication()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("请求参数不合法"));
    }

    @Test
    void uploadLimitExceededReturnsPayloadTooLarge() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "large.json",
                "application/json",
                "{}".getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/admin/files/upload")
                        .file(file)
                        .principal(adminAuthentication()))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(jsonPath("$.code").value(413))
                .andExpect(jsonPath("$.message").value("上传文件超过大小限制"));
    }

    @Test
    void unsupportedMethodKeepsFrameworkStatusAndAllowHeader() throws Exception {
        mockMvc.perform(post("/api/admin/files"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(header().string(HttpHeaders.ALLOW, "GET"))
                .andExpect(jsonPath("$.code").value(405))
                .andExpect(jsonPath("$.message").value("请求方式不支持"));
    }

    @Test
    void unsupportedMediaTypeKeepsFrameworkStatus() throws Exception {
        mockMvc.perform(post("/test/json-only")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("{}"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.code").value(415))
                .andExpect(jsonPath("$.message").value("请求媒体类型不支持"));
    }

    private Authentication adminAuthentication() {
        return new UsernamePasswordAuthenticationToken("admin", "n/a", List.of());
    }

    private static final class UploadLimitFileService extends FileService {

        private UploadLimitFileService() {
            super(null);
        }

        @Override
        public UploadFile saveFile(MultipartFile file, String uploader) {
            throw new MaxUploadSizeExceededException(50L * 1024 * 1024);
        }
    }

    @RestController
    private static final class JsonOnlyController {

        @PostMapping(value = "/test/json-only", consumes = MediaType.APPLICATION_JSON_VALUE)
        public Result<Void> acceptJson() {
            return Result.success();
        }
    }
}
