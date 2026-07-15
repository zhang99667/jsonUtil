package com.jsonhelper.backend.service;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RefererSourceClassifierTest {

    @ParameterizedTest
    @MethodSource("refererCases")
    void classifiesOnlyByHttpHost(String referer, String expectedSource) {
        assertEquals(expectedSource, RefererSourceClassifier.classify(referer));
    }

    private static Stream<Arguments> refererCases() {
        return Stream.of(
                Arguments.of(null, "直接访问"),
                Arguments.of("   ", "直接访问"),
                Arguments.of("https://jsonutils.markz.fun/path", "站内跳转"),
                Arguments.of("https://markz.fun/", "站内跳转"),
                Arguments.of("http://www.markz.fun/", "站内跳转"),
                Arguments.of("http://localhost:5173/", "站内跳转"),
                Arguments.of("http://127.0.0.1:5173/", "站内跳转"),
                Arguments.of("https://www.google.com/search?q=json", "搜索引擎"),
                Arguments.of("https://google.de/search?q=json", "搜索引擎"),
                Arguments.of("https://news.google.fr/path", "搜索引擎"),
                Arguments.of("https://www.google.com.au/search?q=json", "搜索引擎"),
                Arguments.of("https://www.google.co.uk/search?q=json", "搜索引擎"),
                Arguments.of("https://google.cat/search?q=json", "搜索引擎"),
                Arguments.of("https://so.com/s?q=json", "搜索引擎"),
                Arguments.of("https://www.zhihu.com/question/1", "社交媒体"),
                Arguments.of("https://weixin.qq.com/path", "社交媒体"),
                Arguments.of("https://github.com/openai", "技术社区"),
                Arguments.of("https://gist.github.com/example", "技术社区"),
                Arguments.of("HTTPS://GITHUB.COM./openai", "技术社区"),
                Arguments.of("https://evil.example/path?next=https://jsonutils.markz.fun", "外部链接"),
                Arguments.of("https://github.com.evil.example/path", "外部链接"),
                Arguments.of("https://google.evil/path", "外部链接"),
                Arguments.of("https://google.zz/path", "外部链接"),
                Arguments.of("https://google.co.zz/path", "外部链接"),
                Arguments.of("https://google.com.au.evil.example/path", "外部链接"),
                Arguments.of("https://evil.example/path/github.com", "外部链接"),
                Arguments.of("https://notso.com/path", "外部链接"),
                Arguments.of("https://jsonutils.markz.fun.evil.example", "外部链接"),
                Arguments.of("https://zhangjihao.markz.fun", "外部链接"),
                Arguments.of("https://github.com@evil.example", "外部链接"),
                Arguments.of("mailto:user@github.com", "外部链接"),
                Arguments.of("//github.com/openai", "外部链接"),
                Arguments.of("not a valid uri", "外部链接")
        );
    }
}
