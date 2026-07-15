package com.jsonhelper.backend.entity;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JpaEntityIdentityTest {

    @Test
    void visitLogKeepsIdentityStableAfterIdAssignment() {
        assertStableIdentity(new VisitLog(), new VisitLog(), entity -> entity.setId(1L));
    }

    @Test
    void uploadFileKeepsIdentityStableAfterIdAssignment() {
        assertStableIdentity(new UploadFile(), new UploadFile(), entity -> entity.setId(1L));
    }

    @Test
    void toolEventKeepsIdentityStableAfterIdAssignment() {
        assertStableIdentity(new ToolEvent(), new ToolEvent(), entity -> entity.setId(1L));
    }

    @Test
    void userKeepsIdentityStableAfterIdAssignment() {
        assertStableIdentity(new User(), new User(), entity -> entity.setId(1L));
    }

    @Test
    void orderKeepsIdentityStableAfterIdAssignment() {
        assertStableIdentity(new Order(), new Order(), entity -> entity.setId(1L));
    }

    @Test
    void subscriptionKeepsIdentityStableAfterIdAssignment() {
        assertStableIdentity(new Subscription(), new Subscription(), entity -> entity.setId(1L));
    }

    private static <T> void assertStableIdentity(T first, T second, Consumer<T> assignId) {
        boolean distinctBeforePersistence = !first.equals(second);
        Set<T> entities = new HashSet<>();
        entities.add(first);
        assignId.accept(first);
        boolean reachableAfterIdAssignment = entities.contains(first);

        assertAll(
                () -> assertTrue(distinctBeforePersistence, "两个新建实体必须保持独立身份"),
                () -> assertTrue(reachableAfterIdAssignment, "分配 ID 后实体必须仍能从 HashSet 中命中"),
                () -> assertNotEquals(first, second, "分配 ID 后实体不应与另一个新建实体相等")
        );
    }
}
