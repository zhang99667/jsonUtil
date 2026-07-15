package com.jsonhelper.backend.controller;

import com.jsonhelper.backend.dto.ToolEventRequest;
import com.jsonhelper.backend.dto.response.Result;
import com.jsonhelper.backend.service.ToolEventService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/visitor")
@RequiredArgsConstructor
public class VisitorController {

    private final ToolEventService toolEventService;

    @GetMapping("/ping")
    public Result<String> ping() {
        return Result.success("pong");
    }

    /**
     * 记录主工具匿名使用事件，不接收 JSON 原文或路径值。
     */
    @PostMapping("/events")
    public Result<Void> recordToolEvent(@Valid @NotNull @RequestBody ToolEventRequest request) {
        toolEventService.recordEvent(request);
        return Result.success();
    }
}
