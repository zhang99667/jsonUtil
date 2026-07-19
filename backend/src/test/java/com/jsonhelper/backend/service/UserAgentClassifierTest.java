package com.jsonhelper.backend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;

class UserAgentClassifierTest {

    private static final String ANDROID_TABLET =
            "Mozilla/5.0 (Linux; Android 13; SM-X710 Build/TP1A.220624.014) AppleWebKit/537.36 "
                    + "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    private static final String IPAD_SAFARI =
            "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 "
                    + "(KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
    private static final String MOBILE_GOOGLEBOT =
            "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 "
                    + "(KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36 "
                    + "(compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
    private static final String IOS_EDGE =
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 "
                    + "(KHTML, like Gecko) EdgiOS/123.0 Mobile/15E148 Safari/605.1.15";
    private static final String ANDROID_EDGE =
            "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UP1A.231005.007) AppleWebKit/537.36 "
                    + "(KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36 EdgA/123.0";
    private static final String IOS_CHROME =
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 "
                    + "(KHTML, like Gecko) CriOS/123.0 Mobile/15E148 Safari/604.1";
    private static final String CUBOT_CHROME =
            "Mozilla/5.0 (Linux; Android 13; CUBOT X70 Build/TP1A.220624.014) AppleWebKit/537.36 "
                    + "(KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
    private static final String WINDOWS_CHROME =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    + "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    private static final String MAC_FIREFOX =
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0";
    private static final String BINGBOT =
            "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)";

    private static final UserAgentClassifier CLASSIFIER = new UserAgentClassifier();

    static Stream<Arguments> deviceCases() {
        return Stream.of(
                Arguments.of(ANDROID_TABLET, "平板"),
                Arguments.of(IPAD_SAFARI, "平板"),
                Arguments.of(MOBILE_GOOGLEBOT, "爬虫"),
                Arguments.of(IOS_EDGE, "手机"),
                Arguments.of(ANDROID_EDGE, "手机"),
                Arguments.of(IOS_CHROME, "手机"),
                Arguments.of(CUBOT_CHROME, "手机"),
                Arguments.of(WINDOWS_CHROME, "电脑"),
                Arguments.of(MAC_FIREFOX, "电脑"),
                Arguments.of("curl/8.6.0", "爬虫")
        );
    }

    static Stream<Arguments> browserCases() {
        return Stream.of(
                Arguments.of(ANDROID_TABLET, "Chrome"),
                Arguments.of(IPAD_SAFARI, "Safari"),
                Arguments.of(MOBILE_GOOGLEBOT, "Googlebot"),
                Arguments.of(BINGBOT, "Bingbot"),
                Arguments.of(IOS_EDGE, "Edge"),
                Arguments.of(ANDROID_EDGE, "Edge"),
                Arguments.of(IOS_CHROME, "Chrome"),
                Arguments.of(CUBOT_CHROME, "Chrome"),
                Arguments.of(WINDOWS_CHROME, "Chrome"),
                Arguments.of(MAC_FIREFOX, "Firefox"),
                Arguments.of("curl/8.6.0", "其他爬虫")
        );
    }

    @ParameterizedTest
    @MethodSource("deviceCases")
    void 将真实访问端归入稳定设备桶(String userAgent, String expected) {
        assertEquals(expected, CLASSIFIER.classifyDevice(userAgent));
    }

    @ParameterizedTest
    @MethodSource("browserCases")
    void 将真实访问端归入稳定浏览器桶(String userAgent, String expected) {
        assertEquals(expected, CLASSIFIER.classifyBrowser(userAgent));
    }

    @Test
    void 空白输入无需加载规则并返回未知() {
        UserAgentClassifier lazyClassifier = new UserAgentClassifier(() -> {
            throw new AssertionError("空白输入不应加载解析器");
        });

        assertEquals("未知", lazyClassifier.classifyDevice(null));
        assertEquals("未知", lazyClassifier.classifyDevice(""));
        assertEquals("未知", lazyClassifier.classifyBrowser("   "));
    }

    @Test
    void 畸形输入不会中断统计分类() {
        String malformedUserAgent = "\u0000".repeat(512);

        assertEquals("其他", CLASSIFIER.classifyDevice(malformedUserAgent));
        assertEquals("其他", CLASSIFIER.classifyBrowser(malformedUserAgent));
    }

    @Test
    void 解析器异常时降级到其他分类() {
        UserAgentClassifier failingClassifier = new UserAgentClassifier(
                () -> userAgent -> {
                    throw new IllegalArgumentException("无效访问端");
                }
        );

        assertEquals("其他", failingClassifier.classifyDevice("invalid"));
        assertEquals("其他", failingClassifier.classifyBrowser("invalid"));
    }
}
