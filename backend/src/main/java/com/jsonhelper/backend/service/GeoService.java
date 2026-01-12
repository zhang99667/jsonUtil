package com.jsonhelper.backend.service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.lionsoul.ip2region.xdb.Searcher;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;

@Service
@Slf4j
public class GeoService {

    private Searcher searcher;
    private byte[] cBuff;

    @PostConstruct
    public void init() {
        try {
            // 从 classpath 加载 ip2region_v4.xdb 数据文件
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
        
        // localhost
        if ("localhost".equalsIgnoreCase(ip) || "127.0.0.1".equals(ip) || "::1".equals(ip)) {
            return true;
        }
        
        // 内网IP段
        // 10.0.0.0 - 10.255.255.255
        // 172.16.0.0 - 172.31.255.255
        // 192.168.0.0 - 192.168.255.255
        if (ip.startsWith("10.") || ip.startsWith("192.168.")) {
            return true;
        }
        
        if (ip.startsWith("172.")) {
            try {
                String[] parts = ip.split("\\.");
                int second = Integer.parseInt(parts[1]);
                if (second >= 16 && second <= 31) {
                    return true;
                }
            } catch (Exception e) {
                // 忽略解析错误
            }
        }
        
        return false;
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