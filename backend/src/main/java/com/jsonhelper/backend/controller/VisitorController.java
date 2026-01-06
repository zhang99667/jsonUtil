package com.jsonhelper.backend.controller;

import com.jsonhelper.backend.dto.response.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/visitor")
public class VisitorController {

    @GetMapping("/ping")
    public Result<String> ping() {
        return Result.success("pong");
    }
}
