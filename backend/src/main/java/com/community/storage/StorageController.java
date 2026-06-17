package com.community.storage;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/storage")
public class StorageController {

    private final FileStorageService storageService;

    public StorageController(FileStorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "prefix", defaultValue = "uploads") String prefix) {
        String objectName = storageService.uploadFile(prefix, file);
        return ResponseEntity.ok(Map.of(
                "objectName", objectName,
                "url", "http://localhost:8080/api/storage/download/" + objectName
        ));
    }

    @GetMapping("/download/{*objectName}")
    public ResponseEntity<byte[]> download(@PathVariable String objectName) {
        if (objectName.startsWith("/")) {
            objectName = objectName.substring(1);
        }
        byte[] data = storageService.getFile(objectName);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
    }

    @GetMapping("/url/{*objectName}")
    public ResponseEntity<Map<String, String>> getUrl(
            @PathVariable String objectName,
            @RequestParam(value = "expiry", defaultValue = "3600") int expiry) {
        if (objectName.startsWith("/")) {
            objectName = objectName.substring(1);
        }
        String url = storageService.getPresignedUrl(objectName, expiry);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @DeleteMapping("/{*objectName}")
    public ResponseEntity<Void> delete(@PathVariable String objectName) {
        if (objectName.startsWith("/")) {
            objectName = objectName.substring(1);
        }
        storageService.deleteFile(objectName);
        return ResponseEntity.noContent().build();
    }
}
