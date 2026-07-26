package com.jsonhelper.backend.dto;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.lang.reflect.RecordComponent;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthUserDtoRecordTest {

    static Stream<Arguments> recordContracts() {
        return Stream.of(
                Arguments.of(LoginRequest.class, List.of("username", "password")),
                Arguments.of(RegisterRequest.class, List.of("username", "password", "role")),
                Arguments.of(UpdateUserRequest.class, List.of("username", "email", "password", "role", "enabled")),
                Arguments.of(JwtResponse.class, List.of("token"))
        );
    }

    @ParameterizedTest
    @MethodSource("recordContracts")
    void dtoKeepsImmutableRecordShape(Class<?> dtoType, List<String> expectedComponents) {
        assertTrue(dtoType.isRecord(), dtoType.getSimpleName() + " 必须保持为不可变记录");
        List<String> actualComponents = Arrays.stream(dtoType.getRecordComponents())
                .map(RecordComponent::getName)
                .toList();

        assertEquals(expectedComponents, actualComponents);
    }
}
