package com.community.user;

import com.community.auth.AuthPrincipal;
import com.community.user.dto.UserSettingsDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/settings")
public class UserSettingsController {

    private final UserSettingsService userSettingsService;

    public UserSettingsController(UserSettingsService userSettingsService) {
        this.userSettingsService = userSettingsService;
    }

    @GetMapping
    public ResponseEntity<UserSettingsDto> getSettings(@AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(userSettingsService.getSettings(UUID.fromString(principal.userId())));
    }

    @PutMapping
    public ResponseEntity<UserSettingsDto> updateSettings(
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestBody UserSettingsDto dto) {
        return ResponseEntity.ok(userSettingsService.updateSettings(UUID.fromString(principal.userId()), dto));
    }
}
