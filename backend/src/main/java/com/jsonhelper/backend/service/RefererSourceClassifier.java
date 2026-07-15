package com.jsonhelper.backend.service;

import java.net.URI;
import java.util.Locale;
import java.util.Set;

/**
 * 仅根据来源地址的协议和主机名分类，避免路径与查询参数污染统计。
 */
final class RefererSourceClassifier {

    // 来源为 Google 官方支持域名清单，快照复核日期为 2026-07-14。
    private static final Set<String> GOOGLE_DOMAIN_SUFFIXES = Set.of("""
            com ad ae com.af com.ag al am co.ao com.ar as at com.au az ba com.bd be bf bg com.bh bi bj com.bn
            com.bo com.br bs bt co.bw by com.bz ca cd cf cg ch ci co.ck cl cm cn com.co co.cr com.cu cv com.cy
            cz de dj dk dm com.do dz com.ec ee com.eg es com.et fi com.fj fm fr ga ge gg com.gh com.gi gl gm gr
            com.gt gy com.hk hn hr ht hu co.id ie co.il im co.in iq is it je com.jm jo co.jp co.ke com.kh ki kg
            co.kr com.kw kz la com.lb li lk co.ls lt lu lv com.ly co.ma md me mg mk ml com.mm mn com.mt mu mv mw
            com.mx com.my co.mz com.na com.ng com.ni ne nl no com.np nr nu co.nz com.om com.pa com.pe com.pg
            com.ph com.pk pl pn com.pr ps pt com.py com.qa ro ru rw com.sa com.sb sc se com.sg sh si sk com.sl sn
            so sm sr st com.sv td tg co.th com.tj tl tm tn to com.tr tt com.tw co.tz com.ua co.ug co.uk com.uy
            com.uz com.vc co.ve co.vi com.vn vu ws rs co.za co.zm co.zw cat
            """.trim().split("\\s+"));
    private static final Set<String> INTERNAL_HOSTS = Set.of(
            "jsonutils.markz.fun", "markz.fun", "www.markz.fun", "localhost", "127.0.0.1"
    );
    private static final Set<String> SEARCH_ENGINE_DOMAINS = Set.of(
            "bing.com", "bing.cn", "baidu.com", "sogou.com", "so.com", "yahoo.com", "yahoo.co.jp",
            "yahoo.co.uk", "duckduckgo.com"
    );
    private static final Set<String> SOCIAL_MEDIA_DOMAINS = Set.of(
            "weibo.com", "weixin.qq.com", "wechat.com", "qq.com", "zhihu.com", "douyin.com", "tiktok.com",
            "twitter.com", "x.com", "facebook.com", "linkedin.com", "instagram.com", "reddit.com"
    );
    private static final Set<String> TECH_COMMUNITY_DOMAINS = Set.of(
            "github.com", "gitee.com", "csdn.net", "juejin.cn", "segmentfault.com", "stackoverflow.com", "v2ex.com"
    );

    private RefererSourceClassifier() {
    }

    static String classify(String referer) {
        if (referer == null || referer.isBlank()) {
            return "直接访问";
        }

        String host = parseHttpHost(referer);
        if (host == null) {
            return "外部链接";
        }
        if (INTERNAL_HOSTS.contains(host)) {
            return "站内跳转";
        }
        if (matchesGoogleDomain(host)
                || matchesAnyDomain(host, SEARCH_ENGINE_DOMAINS)) {
            return "搜索引擎";
        }
        if (matchesAnyDomain(host, SOCIAL_MEDIA_DOMAINS)) {
            return "社交媒体";
        }
        if (matchesAnyDomain(host, TECH_COMMUNITY_DOMAINS)) {
            return "技术社区";
        }
        return "外部链接";
    }

    private static String parseHttpHost(String referer) {
        try {
            URI uri = URI.create(referer.trim());
            String scheme = uri.getScheme();
            String host = uri.getHost();
            if (scheme == null || host == null
                    || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
                return null;
            }
            String normalizedHost = host.toLowerCase(Locale.ROOT);
            return normalizedHost.endsWith(".")
                    ? normalizedHost.substring(0, normalizedHost.length() - 1)
                    : normalizedHost;
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    private static boolean matchesAnyDomain(String host, Set<String> domains) {
        return domains.stream().anyMatch(domain -> host.equals(domain) || host.endsWith("." + domain));
    }

    private static boolean matchesGoogleDomain(String host) {
        int subdomainMarker = host.lastIndexOf(".google.");
        if (subdomainMarker >= 0) {
            return GOOGLE_DOMAIN_SUFFIXES.contains(host.substring(subdomainMarker + ".google.".length()));
        }
        return host.startsWith("google.")
                && GOOGLE_DOMAIN_SUFFIXES.contains(host.substring("google.".length()));
    }
}
