package com.community.post.vote;

import com.community.auth.AuthPrincipal;
import com.community.post.dto.VoteRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/posts/{postId}/vote")
@RequiredArgsConstructor
public class PostVoteController {

    private final PostVoteService postVoteService;

    @PostMapping
    public ResponseEntity<Void> vote(
            @PathVariable UUID postId,
            @Valid @RequestBody VoteRequest request,
            @AuthenticationPrincipal AuthPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        postVoteService.vote(postId, UUID.fromString(principal.userId()), request);
        return ResponseEntity.ok().build();
    }
}
