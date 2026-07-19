package com.jsonhelper.backend.service;

import com.jsonhelper.backend.repository.UploadFileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileServicePaginationTest {

    @Mock
    private UploadFileRepository uploadFileRepository;

    private FileService fileService;

    @BeforeEach
    void setUp() {
        fileService = new FileService(uploadFileRepository);
    }

    @Test
    void fileListUsesUniqueStableSort() {
        when(uploadFileRepository.findAll(any(Pageable.class))).thenReturn(Page.empty());

        fileService.listFiles(0, 20, null);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(uploadFileRepository).findAll(pageableCaptor.capture());
        List<Sort.Order> orders = pageableCaptor.getValue().getSort().stream().toList();
        assertEquals(List.of(Sort.Order.desc("createdAt"), Sort.Order.desc("id")), orders);
    }
}
