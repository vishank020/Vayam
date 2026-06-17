package com.community.storage;

import io.minio.*;
import io.minio.http.Method;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Set;
import java.util.UUID;

@Service
public class MinioStorageService implements FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(MinioStorageService.class);
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "video/mp4", "video/webm"
    );

    private final MinioClient minioClient;
    private final StorageProperties properties;
    private boolean available = false;

    public MinioStorageService(MinioClient minioClient, StorageProperties properties) {
        this.minioClient = minioClient;
        this.properties = properties;
    }

    @PostConstruct
    public void init() {
        try {
            boolean found = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(properties.bucketName()).build());
            if (!found) {
                minioClient.makeBucket(
                        MakeBucketArgs.builder().bucket(properties.bucketName()).build());
            }
            this.available = true;
            log.info("MinIO initialized successfully at {}", properties.endpoint());
        } catch (Exception e) {
            log.warn("MinIO not available at {} — file upload will be disabled: {}", properties.endpoint(), e.getMessage());
        }
    }

    @Override
    public String uploadFile(String prefix, MultipartFile file) {
        if (!available) throw new RuntimeException("File storage is not available");
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("File type not allowed: " + file.getContentType());
        }

        String objectName = prefix + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
        try (InputStream inputStream = file.getInputStream()) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(properties.bucketName())
                            .object(objectName)
                            .stream(inputStream, file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build());
            return objectName;
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload file to MinIO", e);
        }
    }

    @Override
    public byte[] getFile(String objectName) {
        if (!available) throw new RuntimeException("File storage is not available");
        try {
            try (InputStream stream = minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(properties.bucketName())
                            .object(objectName)
                            .build())) {
                return stream.readAllBytes();
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch file from MinIO", e);
        }
    }

    @Override
    public String getPresignedUrl(String objectName, int expiryInSeconds) {
        if (!available) throw new RuntimeException("File storage is not available");
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(properties.bucketName())
                            .object(objectName)
                            .expiry(expiryInSeconds)
                            .build());
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate presigned URL", e);
        }
    }

    @Override
    public void deleteFile(String objectName) {
        if (!available) throw new RuntimeException("File storage is not available");
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(properties.bucketName())
                            .object(objectName)
                            .build());
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete file from MinIO", e);
        }
    }
}
