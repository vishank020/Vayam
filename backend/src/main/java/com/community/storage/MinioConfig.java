package com.community.storage;

import io.minio.MinioClient;
import okhttp3.HttpUrl;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Interceptor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.URI;

@Configuration
@EnableConfigurationProperties(StorageProperties.class)
public class MinioConfig {

    @Bean
    public MinioClient minioClient(StorageProperties properties) {
        URI uri = URI.create(properties.endpoint());
        String hostUrl = uri.getScheme() + "://" + uri.getHost()
                + (uri.getPort() > 0 ? ":" + uri.getPort() : "");
        String pathPrefix = uri.getRawPath();

        OkHttpClient httpClient = new OkHttpClient.Builder()
                .addInterceptor(new PathPrefixInterceptor(pathPrefix))
                .build();

        return MinioClient.builder()
                .endpoint(hostUrl)
                .credentials(properties.accessKey(), properties.secretKey())
                .region(properties.region())
                .httpClient(httpClient)
                .build();
    }

    private static class PathPrefixInterceptor implements Interceptor {
        private final String prefix;

        PathPrefixInterceptor(String prefix) {
            this.prefix = prefix != null && !prefix.isEmpty() ? prefix : "";
        }

        @Override
        public okhttp3.Response intercept(Chain chain) throws java.io.IOException {
            Request original = chain.request();
            if (!prefix.isEmpty()) {
                String rewritten = prefix + original.url().encodedPath();
                HttpUrl newUrl = original.url().newBuilder()
                        .encodedPath(rewritten)
                        .build();
                original = original.newBuilder().url(newUrl).build();
            }
            return chain.proceed(original);
        }
    }
}
