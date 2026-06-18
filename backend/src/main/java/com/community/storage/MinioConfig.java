package com.community.storage;

import io.minio.MinioClient;
import okhttp3.HttpUrl;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.lang.reflect.Field;
import java.net.URI;

@Configuration
@EnableConfigurationProperties(StorageProperties.class)
public class MinioConfig {

    @Bean
    public MinioClient minioClient(StorageProperties properties) {
        URI uri = URI.create(properties.endpoint());
        String hostOnly = uri.getScheme() + "://" + uri.getHost()
                + (uri.getPort() > 0 ? ":" + uri.getPort() : "");

        MinioClient client = MinioClient.builder()
                .endpoint(hostOnly)
                .credentials(properties.accessKey(), properties.secretKey())
                .region(properties.region())
                .build();

        String path = uri.getRawPath();
        if (path != null && !path.isEmpty() && !"/".equals(path)) {
            try {
                HttpUrl fullUrl = HttpUrl.parse(properties.endpoint());
                Field asyncField = MinioClient.class.getDeclaredField("asyncClient");
                asyncField.setAccessible(true);
                Object asyncClient = asyncField.get(client);
                Field baseUrlField = Class.forName("io.minio.S3Base")
                        .getDeclaredField("baseUrl");
                baseUrlField.setAccessible(true);
                baseUrlField.set(asyncClient, fullUrl);
            } catch (Exception e) {
                throw new RuntimeException(
                        "Failed to configure MinIO client for endpoint: " + properties.endpoint(), e);
            }
        }

        return client;
    }
}
