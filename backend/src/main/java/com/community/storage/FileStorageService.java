package com.community.storage;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    String uploadFile(String prefix, MultipartFile file);

    byte[] getFile(String objectName);

    String getPresignedUrl(String objectName, int expiryInSeconds);

    void deleteFile(String objectName);
}
