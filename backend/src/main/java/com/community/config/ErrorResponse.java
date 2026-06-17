package com.community.config;

import java.time.Instant;

public record ErrorResponse(int status, String error, String message, String timestamp) {
    public ErrorResponse(int status, String error, String message) {
        this(status, error, message, Instant.now().toString());
    }
}
