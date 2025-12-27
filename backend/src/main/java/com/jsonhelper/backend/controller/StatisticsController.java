package com.jsonhelper.backend.controller;

import com.jsonhelper.backend.dto.response.Result;
import com.jsonhelper.backend.dto.response.StatisticsDTO;
import com.jsonhelper.backend.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping
    public Result<StatisticsDTO> getStatistics() {
        StatisticsDTO stats = statisticsService.getStatistics();
        return Result.success(stats);
    }
}
