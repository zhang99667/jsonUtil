package com.jsonhelper.backend.controller;

import com.jsonhelper.backend.dto.response.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    /**
     * 供部署脚本和外部监控探活使用，不参与访客 PV/UV 统计。
     */
    @GetMapping("/api/health")
    public Result<String> health() {
        return Result.success("pong");
    }
}
