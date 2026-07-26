package com.jsonhelper.backend.controller;

import com.jsonhelper.backend.dto.response.FileItemDTO;
import com.jsonhelper.backend.dto.response.FileListDTO;
import com.jsonhelper.backend.entity.UploadFile;
import com.jsonhelper.backend.service.FileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileControllerResponseTest {

    @Mock
    FileService fileService;

    @Mock
    Authentication authentication;

    private FileController controller;

    @BeforeEach
    void setUp() {
        controller = new FileController(fileService);
    }

    @Test
    void listFilesReturnsTypedPageAndConvertsOneBasedPageNumber() {
        UploadFile datedFile = file(
                1L,
                "report.json",
                128L,
                "application/json",
                LocalDateTime.of(2026, 7, 19, 8, 9, 10),
                "admin"
        );
        UploadFile undatedFile = file(2L, "draft.json", 2L, null, null, "operator");
        when(fileService.listFiles(2, 25, "报告")).thenReturn(new PageImpl<>(
                List.of(datedFile, undatedFile),
                PageRequest.of(2, 25),
                52
        ));

        FileListDTO result = controller.listFiles(3, 25, "报告").getData();

        assertEquals(52, result.total());
        assertEquals(List.of(
                new FileItemDTO(
                        1L,
                        "report.json",
                        128L,
                        "application/json",
                        "2026-07-19 08:09:10",
                        "admin"
                ),
                new FileItemDTO(2L, "draft.json", 2L, null, "", "operator")
        ), result.list());
        verify(fileService).listFiles(2, 25, "报告");
    }

    @Test
    void fileListCopiesItemsAndDoesNotExposeMutableResponseState() {
        List<FileItemDTO> source = new ArrayList<>();
        FileListDTO result = new FileListDTO(source, 0);

        source.add(new FileItemDTO(1L, "late.json", 1L, null, "", "admin"));

        assertEquals(List.of(), result.list());
        assertThrows(
                UnsupportedOperationException.class,
                () -> result.list().add(new FileItemDTO(2L, "other.json", 1L, null, "", "admin"))
        );
    }

    @Test
    void uploadFileUsesAuthenticatedNameAndReturnsTypedItem() {
        MockMultipartFile upload = new MockMultipartFile(
                "file",
                "payload.json",
                "application/json",
                "{}".getBytes(StandardCharsets.UTF_8)
        );
        UploadFile savedFile = file(
                7L,
                "payload.json",
                2L,
                "application/json",
                LocalDateTime.of(2026, 7, 19, 10, 30),
                "admin"
        );
        when(authentication.getName()).thenReturn("admin");
        when(fileService.saveFile(upload, "admin")).thenReturn(savedFile);

        FileItemDTO result = controller.uploadFile(upload, authentication).getData();

        assertEquals(new FileItemDTO(
                7L,
                "payload.json",
                2L,
                "application/json",
                "2026-07-19 10:30:00",
                "admin"
        ), result);
        verify(fileService).saveFile(upload, "admin");
    }

    private UploadFile file(
            Long id,
            String fileName,
            Long fileSize,
            String fileType,
            LocalDateTime createdAt,
            String uploader
    ) {
        UploadFile file = new UploadFile();
        file.setId(id);
        file.setFileName(fileName);
        file.setFileSize(fileSize);
        file.setFileType(fileType);
        file.setCreatedAt(createdAt);
        file.setUploader(uploader);
        return file;
    }
}
