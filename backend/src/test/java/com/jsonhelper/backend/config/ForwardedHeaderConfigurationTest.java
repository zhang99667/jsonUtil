package com.jsonhelper.backend.config;

import org.apache.catalina.valves.RemoteIpValve;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.web.ServerProperties;
import org.springframework.boot.autoconfigure.web.embedded.TomcatWebServerFactoryCustomizer;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.context.annotation.Configuration;

import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ForwardedHeaderConfigurationTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withInitializer(new ConfigDataApplicationContextInitializer())
            .withUserConfiguration(ServerPropertiesConfiguration.class);

    @Test
    void applicationConfigRegistersTrustedProxyAwareRemoteIpValve() {
        contextRunner.run(context -> {
            assertNull(context.getStartupFailure());
            ServerProperties properties = context.getBean(ServerProperties.class);
            assertEquals(ServerProperties.ForwardHeadersStrategy.NATIVE,
                    properties.getForwardHeadersStrategy());

            TomcatServletWebServerFactory factory = new TomcatServletWebServerFactory();
            new TomcatWebServerFactoryCustomizer(context.getEnvironment(), properties).customize(factory);
            RemoteIpValve valve = factory.getEngineValves().stream()
                    .filter(RemoteIpValve.class::isInstance)
                    .map(RemoteIpValve.class::cast)
                    .findFirst()
                    .orElseThrow();

            assertEquals("X-Forwarded-For", valve.getRemoteIpHeader());
            assertEquals("X-Forwarded-Proto", valve.getProtocolHeader());
            assertTrue(Pattern.matches(valve.getInternalProxies(), "172.18.0.2"));
            assertTrue(Pattern.matches(valve.getInternalProxies(), "127.0.0.1"));
            assertFalse(Pattern.matches(valve.getInternalProxies(), "203.0.113.10"));
        });
    }

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(ServerProperties.class)
    static class ServerPropertiesConfiguration {
    }
}
