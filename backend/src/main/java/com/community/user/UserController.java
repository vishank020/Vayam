package com.community.user;

import com.community.auth.AuthPrincipal;
import com.community.comment.CommentService;
import com.community.comment.dto.CommentResponse;
import com.community.user.dto.*;
import jakarta.servlet.http.Cookie;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final CommentService commentService;

    public UserController(UserService userService, CommentService commentService) {
        this.userService = userService;
        this.commentService = commentService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile(@AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(userService.getProfile(principal));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(principal, request));
    }

    @DeleteMapping("/me/avatar")
    public ResponseEntity<UserResponse> removeAvatar(@AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(userService.removeAvatar(principal));
    }

    @GetMapping("/check-auth")
    public ResponseEntity<Map<String, Object>> checkAuth(jakarta.servlet.http.HttpServletRequest req) {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        Cookie[] cookies = req.getCookies();
        String cookieToken = null;
        if (cookies != null) {
            for (Cookie c : cookies) {
                if ("access_token".equals(c.getName())) {
                    cookieToken = c.getValue().substring(0, Math.min(20, c.getValue().length())) + "...";
                }
            }
        }
        return ResponseEntity.ok(java.util.Map.of(
            "authPresent", auth != null,
            "authName", auth != null ? auth.getName() : "null",
            "authClass", auth != null ? auth.getClass().getSimpleName() : "null",
            "cookieToken", cookieToken != null ? cookieToken : "null"
        ));
    }

    @PutMapping("/me/public-key")
    public ResponseEntity<Void> updatePublicKey(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody PublicKeyRequest request) {
        userService.updatePublicKey(principal, request.publicKey());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(userService.getProfileById(id, principal));
    }

    @GetMapping("/by-username/{username}")
    public ResponseEntity<UserResponse> getUserByUsername(@PathVariable String username) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        AuthPrincipal ap = null;
        if (auth != null && auth.getPrincipal() instanceof AuthPrincipal p) {
            ap = p;
        }
        return ResponseEntity.ok(userService.getProfileByUsername(username, ap));
    }

    @GetMapping("/{id}/public-key")
    public ResponseEntity<Map<String, String>> getUserPublicKey(@PathVariable UUID id) {
        String publicKey = userService.getPublicKey(id);
        return ResponseEntity.ok(Map.of("publicKey", publicKey));
    }

    @GetMapping("/search")
    public ResponseEntity<java.util.List<UserSummary>> searchUsers(@RequestParam String q) {
        return ResponseEntity.ok(userService.searchUsers(q));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<Page<CommentResponse>> getUserComments(
            @PathVariable UUID id,
            @PageableDefault(size = 20) Pageable pageable) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        AuthPrincipal principal = null;
        if (auth != null && auth.getPrincipal() instanceof AuthPrincipal ap) {
            principal = ap;
        }
        return ResponseEntity.ok(commentService.getUserComments(id, pageable, principal));
    }

}
