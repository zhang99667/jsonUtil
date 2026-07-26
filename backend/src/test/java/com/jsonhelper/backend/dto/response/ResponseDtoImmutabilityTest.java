package com.jsonhelper.backend.dto.response;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ResponseDtoImmutabilityTest {

    private static final List<Class<?>> RESPONSE_TYPES = List.of(
            DailyTrendDTO.class,
            DeviceStatsDTO.class,
            FileItemDTO.class,
            FileListDTO.class,
            GeoStatsDTO.class,
            HourlyStatsDTO.class,
            IpStatsDTO.class,
            PathStatsDTO.class,
            RefererStatsDTO.class,
            Result.class,
            SessionStatsDTO.class,
            StatisticsDTO.class,
            ToolEventGroupDTO.class,
            ToolEventStatsDTO.class,
            TrafficOverviewDTO.class
    );

    @Test
    void responseTypesDoNotExposeMutableFieldsOrSetters() {
        RESPONSE_TYPES.forEach(type -> {
            assertTrue(Modifier.isFinal(type.getModifiers()), type.getName());
            assertTrue(
                    List.of(type.getDeclaredFields()).stream()
                            .filter(field -> !Modifier.isStatic(field.getModifiers()))
                            .allMatch(field -> Modifier.isFinal(field.getModifiers())),
                    type.getName()
            );
            assertFalse(
                    List.of(type.getMethods()).stream()
                            .anyMatch(method -> method.getName().startsWith("set")
                                    && method.getParameterCount() == 1),
                    type.getName()
            );
        });
    }

    @Test
    void toolEventGroupsAreCopiedAndExposedAsReadOnlyLists() {
        ToolEventGroupDTO group = ToolEventGroupDTO.builder()
                .label("成功")
                .count(1)
                .percentage(100)
                .build();
        List<ToolEventGroupDTO> source = new ArrayList<>(List.of(group));
        ToolEventStatsDTO stats = ToolEventStatsDTO.builder()
                .topEvents(source)
                .statusDistribution(source)
                .inputSizeDistribution(source)
                .durationDistribution(source)
                .build();

        source.clear();

        List.of(
                stats.getTopEvents(),
                stats.getStatusDistribution(),
                stats.getInputSizeDistribution(),
                stats.getDurationDistribution()
        ).forEach(groups -> {
            assertEquals(List.of(group), groups);
            assertThrows(UnsupportedOperationException.class, () -> groups.add(group));
        });
    }

    @Test
    void resultFactoriesBuildClosedSuccessAndErrorStates() {
        assertEquals("payload", Result.success("payload").getData());
        assertNull(Result.error(400, "请求错误").getData());
    }

    @Test
    void immutableModelsKeepExistingJsonPropertyContract() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        Result<FileListDTO> files = Result.success(new FileListDTO(
                List.of(new FileItemDTO(1L, "payload.json", 2L, "application/json", "", "admin")),
                1
        ));
        TrafficOverviewDTO overview = TrafficOverviewDTO.builder()
                .totalPv(10)
                .totalUv(8)
                .todayPv(3)
                .todayUv(2)
                .avgDailyPv(5)
                .avgDailyUv(4)
                .days(2)
                .build();

        JsonNode expectedFiles = objectMapper.readTree("""
                {
                  "code": 200,
                  "message": "success",
                  "data": {
                    "list": [{
                      "id": 1,
                      "fileName": "payload.json",
                      "fileSize": 2,
                      "fileType": "application/json",
                      "uploadTime": "",
                      "uploader": "admin"
                    }],
                    "total": 1
                  }
                }
                """);
        JsonNode expectedOverview = objectMapper.readTree("""
                {
                  "totalPv": 10,
                  "totalUv": 8,
                  "todayPv": 3,
                  "todayUv": 2,
                  "avgDailyPv": 5.0,
                  "avgDailyUv": 4.0,
                  "days": 2
                }
                """);

        assertEquals(expectedFiles.toString(), objectMapper.valueToTree(files).toString());
        assertEquals(expectedOverview.toString(), objectMapper.valueToTree(overview).toString());
    }
}
