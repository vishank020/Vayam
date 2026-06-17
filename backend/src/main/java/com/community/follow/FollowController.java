package com.community.follow;

import com.community.auth.AuthPrincipal;
import com.community.follow.dto.FollowCountResponse;
import com.community.follow.dto.FollowResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    @PostMapping("/{userId}/follow")
    public ResponseEntity<Void> follow(@PathVariable UUID userId) {
        followService.follow(getPrincipal(), userId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{userId}/follow")
    public ResponseEntity<Void> unfollow(@PathVariable UUID userId) {
        followService.unfollow(getPrincipal(), userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{userId}/followers")
    public ResponseEntity<Page<FollowResponse>> getFollowers(
            @PathVariable UUID userId,
            Pageable pageable) {
        return ResponseEntity.ok(followService.getFollowers(userId, pageable));
    }

    @GetMapping("/{userId}/following")
    public ResponseEntity<Page<FollowResponse>> getFollowing(
            @PathVariable UUID userId,
            Pageable pageable) {
        return ResponseEntity.ok(followService.getFollowing(userId, pageable));
    }

    @GetMapping("/{userId}/follow-counts")
    public ResponseEntity<FollowCountResponse> getFollowCounts(@PathVariable UUID userId) {
        return ResponseEntity.ok(followService.getCounts(userId));
    }

    @GetMapping("/{userId}/is-following")
    public ResponseEntity<Map<String, Boolean>> isFollowing(@PathVariable UUID userId) {
        AuthPrincipal principal = getPrincipal();
        if (principal == null) {
            return ResponseEntity.ok(Map.of("isFollowing", false));
        }
        boolean following = followService.isFollowing(
                UUID.fromString(principal.userId()), userId);
        return ResponseEntity.ok(Map.of("isFollowing", following));
    }

    private AuthPrincipal getPrincipal() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthPrincipal) {
            return (AuthPrincipal) auth.getPrincipal();
        }
        return null;
    }
}
