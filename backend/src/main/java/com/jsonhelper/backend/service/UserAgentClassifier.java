package com.jsonhelper.backend.service;

import nl.basjes.parse.useragent.UserAgent;
import nl.basjes.parse.useragent.UserAgentAnalyzer;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Objects;
import java.util.function.Supplier;

@Component
public class UserAgentClassifier {

    private static final String UNKNOWN = "未知";
    private static final String OTHER = "其他";
    private final Supplier<UserAgentParser> parserFactory;
    private volatile UserAgentParser parser;

    public UserAgentClassifier() {
        this(UserAgentClassifier::createParser);
    }

    UserAgentClassifier(Supplier<UserAgentParser> parserFactory) {
        this.parserFactory = Objects.requireNonNull(parserFactory);
    }

    String classifyDevice(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) return UNKNOWN;
        ParsedUserAgent parsed = parse(userAgent);
        if (parsed == null) return OTHER;

        String deviceClass = normalize(parsed.deviceClass());
        if (isRobot(deviceClass)) return "爬虫";
        return switch (deviceClass) {
            case "phone", "mobile", "watch" -> "手机";
            case "tablet", "ereader" -> "平板";
            case "desktop" -> "电脑";
            default -> OTHER;
        };
    }

    String classifyBrowser(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) return UNKNOWN;
        ParsedUserAgent parsed = parse(userAgent);
        if (parsed == null) return OTHER;

        String agentName = normalize(parsed.agentName());
        if (agentName.startsWith("googlebot")) return "Googlebot";
        if (agentName.startsWith("bingbot")) return "Bingbot";
        if (isRobot(normalize(parsed.deviceClass()))) return "其他爬虫";
        if (agentName.startsWith("edge")) return "Edge";
        if (agentName.startsWith("opera")) return "Opera";
        if (agentName.startsWith("chrome")) return "Chrome";
        if (agentName.startsWith("firefox")) return "Firefox";
        if (agentName.startsWith("safari")) return "Safari";
        if (agentName.equals("ie") || agentName.startsWith("internet explorer")) return "IE";
        return OTHER;
    }

    private ParsedUserAgent parse(String userAgent) {
        try {
            UserAgent result = getParser().parse(userAgent);
            return new ParsedUserAgent(
                    result.getValue(UserAgent.DEVICE_CLASS),
                    result.getValue(UserAgent.AGENT_NAME)
            );
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private UserAgentParser getParser() {
        UserAgentParser current = parser;
        if (current != null) return current;
        synchronized (this) {
            if (parser == null) parser = parserFactory.get();
            return parser;
        }
    }

    private static UserAgentParser createParser() {
        // 管理统计首次使用时再加载规则，避免增加服务启动耗时。
        UserAgentAnalyzer analyzer = UserAgentAnalyzer.newBuilder()
                .hideMatcherLoadStats()
                .withCache(1_000)
                .withField(UserAgent.DEVICE_CLASS)
                .withField(UserAgent.AGENT_NAME)
                .build();
        return analyzer::parse;
    }

    private static boolean isRobot(String deviceClass) {
        return deviceClass.startsWith("robot");
    }

    private static String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }

    private record ParsedUserAgent(String deviceClass, String agentName) {
    }

    @FunctionalInterface
    interface UserAgentParser {
        UserAgent parse(String userAgent);
    }
}
