package com.community.post;

import com.community.auth.AuthPrincipal;
import com.community.post.dto.CreatePostRequest;
import com.community.post.dto.FeedPostResponse;
import com.community.post.dto.PostResponse;
import com.community.user.dto.ReportRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    public ResponseEntity<PostResponse> createPost(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody CreatePostRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(postService.createPost(principal, request));
    }

    @GetMapping
    public ResponseEntity<Page<FeedPostResponse>> getFeed(
            @RequestParam(required = false) PostType type,
            Pageable pageable,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(postService.getFeed(type, pageable, principal));
    }

    @GetMapping("/communities/{communityId}/posts")
    public ResponseEntity<Page<FeedPostResponse>> getCommunityFeed(
            @PathVariable UUID communityId,
            @RequestParam(required = false) PostType type,
            @RequestParam(required = false) UUID tagId,
            Pageable pageable,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(postService.getCommunityFeed(communityId, type, tagId, pageable, principal));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPost(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(postService.getPost(id, principal));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody CreatePostRequest request) {
        return ResponseEntity.ok(postService.updatePost(id, principal, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthPrincipal principal) {
        postService.deletePost(id, principal);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<FeedPostResponse>> getUserPosts(
            @PathVariable UUID userId,
            @RequestParam(required = false) PostType type,
            Pageable pageable,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(postService.getUserPosts(userId, type, pageable, principal));
    }

    @GetMapping("/drafts")
    public ResponseEntity<Page<FeedPostResponse>> getUserDrafts(
            Pageable pageable,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(postService.getUserDrafts(principal, pageable));
    }

    @GetMapping("/user/{userId}/saved")
    public ResponseEntity<Page<FeedPostResponse>> getUserSavedPosts(
            @PathVariable UUID userId,
            Pageable pageable,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(postService.getUserSavedPosts(userId, pageable, principal));
    }

    @GetMapping("/user/{userId}/upvoted")
    public ResponseEntity<Page<FeedPostResponse>> getUserUpvotedPosts(
            @PathVariable UUID userId,
            Pageable pageable,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(postService.getUserUpvotedPosts(userId, pageable, principal));
    }

    @PostMapping("/{id}/save")
    public ResponseEntity<Void> savePost(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthPrincipal principal) {
        postService.savePost(id, principal);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/save")
    public ResponseEntity<Void> unsavePost(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthPrincipal principal) {
        postService.unsavePost(id, principal);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/pin")
    public ResponseEntity<Void> pinPost(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthPrincipal principal) {
        postService.pinPost(id, principal);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/report")
    public ResponseEntity<Void> reportPost(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody ReportRequest request) {
        postService.reportPost(id, principal, request.reason());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/unpin")
    public ResponseEntity<Void> unpinPost(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthPrincipal principal) {
        postService.unpinPost(id, principal);
        return ResponseEntity.ok().build();
    }
}
