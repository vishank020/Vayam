package com.community.anon;

import com.community.anon.dto.AnonymousIdentityResponse;
import com.community.anon.dto.AnonymousSessionResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/anonymous")
public class AnonymousController {

    private final AnonymousService anonymousService;

    public AnonymousController(AnonymousService anonymousService) {
        this.anonymousService = anonymousService;
    }

    @PostMapping("/session")
    public ResponseEntity<AnonymousSessionResponse> createSession() {
        AnonymousSessionResponse session = anonymousService.createSession();
        return ResponseEntity.created(URI.create("/api/anonymous/me")).body(session);
    }

    @GetMapping("/me")
    public ResponseEntity<AnonymousIdentityResponse> getIdentity(
            @RequestHeader("X-Anonymous-Token") String token) {
        return ResponseEntity.ok(anonymousService.getIdentity(token));
    }

    @PostMapping("/heartbeat")
    public ResponseEntity<Void> heartbeat(
            @RequestHeader("X-Anonymous-Token") String token) {
        anonymousService.updateLastActive(token);
        return ResponseEntity.ok().build();
    }
}
