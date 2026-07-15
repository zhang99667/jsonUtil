package com.jsonhelper.backend.service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.lionsoul.ip2region.xdb.Searcher;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.net.InetAddress;
import java.util.regex.Pattern;

@Service
@Slf4j
public class GeoService {

    private static final Pattern IPV4_LITERAL = Pattern.compile("[0-9]{1,3}(?:\\.[0-9]{1,3}){3}");
    private static final Pattern IPV6_LITERAL = Pattern.compile("[0-9A-Fa-f:][0-9A-Fa-f:.]*");
    private static final Pattern IPV6_ZONE = Pattern.compile("[A-Za-z0-9_.-]{1,64}");

    private Searcher searcher;
    private byte[] cBuff;

    @PostConstruct
    public void init() {
        try {
            // 从类路径加载 ip2region_v4.xdb 数据文件
            ClassPathResource resource = new ClassPathResource("ip2region_v4.xdb");
            try (InputStream is = resource.getInputStream()) {
                cBuff = is.readAllBytes();
                searcher = Searcher.newWithBuffer(cBuff);
                log.info("ip2region 数据库加载成功");
            }
        } catch (Exception e) {
            log.warn("ip2region 数据库加载失败，地理位置解析功能将不可用: {}", e.getMessage());
        }
    }

    @PreDestroy
    public void destroy() {
        if (searcher != null) {
            try {
                searcher.close();
            } catch (Exception e) {
                log.warn("关闭 ip2region searcher 失败", e);
            }
        }
    }

    /**
     * 解析IP地址获取地理位置信息
     * @param ip IP地址
     * @return 地区信息，格式如 "中国|北京|北京市" 或 "本地/内网"
     */
    public GeoInfo parseIp(String ip) {
        // 处理本地/内网IP
        if (isLocalOrPrivateIp(ip)) {
            return new GeoInfo("本地/内网", "本地/内网", "本地/内网");
        }

        if (searcher == null) {
            return new GeoInfo("未知", "未知", "未知");
        }

        try {
            String region = searcher.search(ip);
            // ip2region 返回格式: 国家|区域|省份|城市|ISP
            // 例如: 中国|0|北京|北京市|联通
            return parseRegionString(region);
        } catch (Exception e) {
            log.debug("解析IP {} 失败: {}", ip, e.getMessage());
            return new GeoInfo("未知", "未知", "未知");
        }
    }

    /**
     * 判断是否为本地或内网IP
     */
    private boolean isLocalOrPrivateIp(String ip) {
        if (ip == null || ip.isEmpty()) {
            return true;
        }

        if ("localhost".equalsIgnoreCase(ip)) {
            return true;
        }

        InetAddress address = parseIpLiteral(ip);
        return address != null && (address.isAnyLocalAddress()
                || address.isLoopbackAddress()
                || address.isLinkLocalAddress()
                || address.isSiteLocalAddress()
                || isUniqueLocalIpv6(address));
    }

    private static InetAddress parseIpLiteral(String ip) {
        String candidate = stripIpv6Zone(ip);
        if (candidate == null) {
            return null;
        }

        try {
            if (IPV4_LITERAL.matcher(candidate).matches()) {
                long value = Searcher.checkIP(candidate);
                return InetAddress.getByAddress(new byte[] {
                        (byte) (value >>> 24), (byte) (value >>> 16),
                        (byte) (value >>> 8), (byte) value
                });
            }
            // 只向 JDK 解析器传入已筛选的 IPv6 字面量候选，避免触发 DNS。
            if (candidate.indexOf(':') >= 0 && IPV6_LITERAL.matcher(candidate).matches()) {
                return InetAddress.getByName(candidate);
            }
        } catch (Exception ignored) {
            return null;
        }
        return null;
    }

    private static String stripIpv6Zone(String input) {
        int zoneIndex = input.indexOf('%');
        if (zoneIndex < 0) {
            return input;
        }

        String address = input.substring(0, zoneIndex);
        String zone = input.substring(zoneIndex + 1);
        // 作用域只参与输入校验，不交给 JDK 查询本机网卡。
        return address.indexOf(':') >= 0
                && zoneIndex == input.lastIndexOf('%')
                && IPV6_ZONE.matcher(zone).matches() ? address : null;
    }

    private static boolean isUniqueLocalIpv6(InetAddress address) {
        byte[] bytes = address.getAddress();
        return bytes.length == 16 && (bytes[0] & 0xfe) == 0xfc;
    }

    /**
     * 解析 ip2region 返回的地区字符串
     */
    private GeoInfo parseRegionString(String region) {
        if (region == null || region.isEmpty()) {
            return new GeoInfo("未知", "未知", "未知");
        }
        
        // 格式: 国家|区域|省份|城市|ISP
        String[] parts = region.split("\\|");
        
        String country = parts.length > 0 && !"0".equals(parts[0]) ? parts[0] : "未知";
        String province = parts.length > 2 && !"0".equals(parts[2]) ? parts[2] : "";
        String city = parts.length > 3 && !"0".equals(parts[3]) ? parts[3] : "";
        
        // 如果省份为空，尝试使用国家
        if (province.isEmpty()) {
            province = country;
        }
        
        // 如果城市为空，使用省份
        if (city.isEmpty()) {
            city = province;
        }
        
        return new GeoInfo(country, province, city);
    }

    /**
     * 地理位置信息
     */
    public static class GeoInfo {
        private final String country;
        private final String province;
        private final String city;

        public GeoInfo(String country, String province, String city) {
            this.country = country;
            this.province = province;
            this.city = city;
        }

        public String getCountry() {
            return country;
        }

        public String getProvince() {
            return province;
        }

        public String getCity() {
            return city;
        }

        /**
         * 获取用于统计的地区名称（优先显示省份）
         */
        public String getRegionForStats() {
            if ("本地/内网".equals(province)) {
                return "本地/内网";
            }
            if ("未知".equals(province)) {
                return "未知";
            }
            // 国内显示省份，国外显示国家
            if ("中国".equals(country)) {
                return province;
            }
            return country;
        }
    }
}
