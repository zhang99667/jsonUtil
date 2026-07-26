package com.jsonhelper.backend.dto.response;

import java.util.List;

public record FileListDTO(List<FileItemDTO> list, long total) {

    public FileListDTO {
        list = List.copyOf(list);
    }
}
