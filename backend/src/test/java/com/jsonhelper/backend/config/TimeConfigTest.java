package com.jsonhelper.backend.config;

import org.junit.jupiter.api.Test;

import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TimeConfigTest {

    @Test
    void applicationClockUsesSystemTimeZone() {
        assertEquals(ZoneId.systemDefault(), new TimeConfig().applicationClock().getZone());
    }
}
