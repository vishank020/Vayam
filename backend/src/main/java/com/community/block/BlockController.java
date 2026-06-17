package com.community.block;

import com.community.auth.AuthPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class BlockController {

    private final BlockService blockService;

    public BlockController(BlockService blockService) {
        this.blockService = blockService;
    }

    @PostMapping("/{userId}/block")
    public ResponseEntity<Void> block(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID userId) {
        blockService.block(UUID.fromString(principal.userId()), userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{userId}/block")
    public ResponseEntity<Void> unblock(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID userId) {
        blockService.unblock(UUID.fromString(principal.userId()), userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me/blocked")
    public ResponseEntity<List<UUID>> getBlockedUsers(
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(blockService.getBlockedUserIds(
                UUID.fromString(principal.userId())));
    }
}
