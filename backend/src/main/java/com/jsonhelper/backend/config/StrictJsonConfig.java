package com.jsonhelper.backend.config;

import com.fasterxml.jackson.databind.cfg.CoercionAction;
import com.fasterxml.jackson.databind.cfg.CoercionInputShape;
import com.fasterxml.jackson.databind.type.LogicalType;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class StrictJsonConfig {

    /**
     * 文本字段只接受 JSON 字符串，避免数字或布尔值被静默转换后通过字段校验。
     */
    @Bean
    public Jackson2ObjectMapperBuilderCustomizer rejectScalarToTextCoercion() {
        return builder -> builder.postConfigurer(objectMapper -> {
            var textualCoercion = objectMapper.coercionConfigFor(LogicalType.Textual);
            textualCoercion.setCoercion(CoercionInputShape.Integer, CoercionAction.Fail);
            textualCoercion.setCoercion(CoercionInputShape.Float, CoercionAction.Fail);
            textualCoercion.setCoercion(CoercionInputShape.Boolean, CoercionAction.Fail);
        });
    }
}
