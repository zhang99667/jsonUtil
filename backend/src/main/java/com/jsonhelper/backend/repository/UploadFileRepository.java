package com.jsonhelper.backend.repository;

import com.jsonhelper.backend.entity.UploadFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UploadFileRepository extends JpaRepository<UploadFile, Long> {

    /**
     * 根据文件名模糊搜索（忽略大小写，分页）
     */
    Page<UploadFile> findByFileNameContainingIgnoreCase(String fileName, Pageable pageable);
}
