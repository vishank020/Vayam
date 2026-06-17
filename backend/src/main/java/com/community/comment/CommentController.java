package com.community.comment;

import com.community.auth.AuthPrincipal;
import com.community.comment.dto.CommentResponse;
import com.community.comment.dto.CreateCommentRequest;
import com.community.comment.dto.EditCommentRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/posts/{postId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable UUID postId,
            @Valid @RequestBody CreateCommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.createComment(getPrincipal(), postId, request));
    }

    @GetMapping
    public ResponseEntity<java.util.List<CommentResponse>> getComments(
            @PathVariable UUID postId) {
        return ResponseEntity.ok(commentService.getComments(postId, getPrincipal()));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable UUID commentId) {
        commentService.deleteComment(commentId, getPrincipal());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<CommentResponse> editComment(
            @PathVariable UUID commentId,
            @Valid @RequestBody EditCommentRequest request) {
        return ResponseEntity.ok(commentService.editComment(commentId, request.content(), getPrincipal()));
    }

    private AuthPrincipal getPrincipal() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthPrincipal) {
            return (AuthPrincipal) auth.getPrincipal();
        }
        return null;
    }
}
