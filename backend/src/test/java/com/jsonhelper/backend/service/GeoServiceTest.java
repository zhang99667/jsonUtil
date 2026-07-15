package com.jsonhelper.backend.service;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GeoServiceTest {

    private final GeoService geoService = new GeoService();

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {
            "", "localhost", "LOCALHOST",
            "0.0.0.0", "127.0.0.2", "127.255.255.255", "169.254.1.2",
            "10.0.0.1", "10.255.255.255", "172.16.0.1", "172.31.255.255",
            "192.168.0.1", "192.168.255.255",
            "::", "::1", "fe80::1", "fe80::1%definitely-missing-interface",
            "fec0::1", "fc00::1", "fdff:ffff::1",
            "::ffff:127.0.0.2", "::ffff:192.168.1.2"
    })
    void localAndPrivateAddressesAreClassifiedAsInternal(String ip) {
        assertEquals("本地/内网", geoService.parseIp(ip).getRegionForStats());
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "8.8.8.8", "172.15.255.255", "172.32.0.0", "2001:4860:4860::8888",
            "::ffff:8.8.8.8", "64:ff9b::10.0.0.1",
            "10.invalid", "10.0.0", "10.0.0.256", "10.+1.2.3",
            "172.16", "172.16.invalid", "172.16.0", "172.16.0.1.extra",
            "192.168.bad", "192.168.1", "192.168.0.256", "256.0.0.1", "-1.0.0.1",
            "10.0.0.1.", "+10.0.0.1", "127.1", "2130706433", "[::1]", "::::",
            ".:", ".:1",
            "127.0.0.1.example", "10.0.0.1:80", "fe80::1.example",
            "fe80::1%", "fe80::1%zone%extra", "fe80::1%bad zone", " "
    })
    void publicAndInvalidAddressesAreNotClassifiedAsInternal(String ip) {
        assertEquals("未知", geoService.parseIp(ip).getRegionForStats());
    }
}
