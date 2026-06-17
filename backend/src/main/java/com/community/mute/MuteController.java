package com.community.mute;

import com.community.auth.AuthPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class MuteController {

    private final MuteService muteService;

    public MuteController(MuteService muteService) {
        this.muteService = muteService;
    }

    @PostMapping("/{userId}/mute")
    public ResponseEntity<Void> muteUser(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable String userId) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        muteService.mute(principal.userId(), userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{userId}/mute")
    public ResponseEntity<Void> unmuteUser(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable String userId) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        muteService.unmute(principal.userId(), userId);
        return ResponseEntity.ok().build();
    }
}
