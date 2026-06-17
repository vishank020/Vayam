package com.community.comment.vote;

import com.community.auth.AuthPrincipal;
import com.community.post.dto.VoteRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/posts/{postId}/comments/{commentId}/vote")
@RequiredArgsConstructor
public class CommentVoteController {

    private final CommentVoteService commentVoteService;

    @PostMapping
    public ResponseEntity<Void> vote(
            @PathVariable UUID postId,
            @PathVariable UUID commentId,
            @Valid @RequestBody VoteRequest request,
            @AuthenticationPrincipal AuthPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        commentVoteService.vote(commentId, UUID.fromString(principal.userId()), request);
        return ResponseEntity.ok().build();
    }
}
