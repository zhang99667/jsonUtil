package com.jsonhelper.backend.dto.response;

import lombok.Value;

@Value
public class Result<T> {
    Integer code;
    String message;
    T data;

    public static <T> Result<T> success(T data) {
        return new Result<>(200, "success", data);
    }

    public static <T> Result<T> success() {
        return success(null);
    }

    public static <T> Result<T> error(Integer code, String message) {
        return new Result<>(code, message, null);
    }
}
