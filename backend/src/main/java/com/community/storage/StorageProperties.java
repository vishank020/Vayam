package com.community.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.storage")
public record StorageProperties(
    String endpoint,
    String accessKey,
    String secretKey,
    String bucketName,
    String region
) {
    public StorageProperties() {
        this("http://localhost:9000", "minioadmin", "minioadmin", "community", "us-east-1");
    }
}
