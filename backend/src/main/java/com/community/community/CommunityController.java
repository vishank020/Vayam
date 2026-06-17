package com.community.community;

import com.community.auth.AuthPrincipal;
import com.community.community.dto.*;
import com.community.comment.CommentRepository;
import com.community.post.PostRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/communities")
public class CommunityController {

    private final CommunityService communityService;

    public CommunityController(CommunityService communityService) {
        this.communityService = communityService;
    }

    @PostMapping
    public ResponseEntity<CommunityResponse> create(
            @Valid @RequestBody CreateCommunityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(communityService.create(getPrincipal(), request));
    }

    @GetMapping
    public ResponseEntity<Page<CommunityResponse>> listPublic(Pageable pageable) {
        return ResponseEntity.ok(communityService.getPublicCommunities(getPrincipal(), pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommunityResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(communityService.getCommunityById(id, getPrincipal()));
    }

    @GetMapping("/by-slug/{slug}")
    public ResponseEntity<CommunityResponse> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(communityService.getCommunityBySlug(slug, getPrincipal()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommunityResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCommunityRequest request) {
        return ResponseEntity.ok(communityService.updateCommunity(id, getPrincipal(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        communityService.deleteCommunity(id, getPrincipal());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<Void> join(@PathVariable UUID id) {
        communityService.joinCommunity(id, getPrincipal());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<Void> leave(@PathVariable UUID id) {
        communityService.leaveCommunity(id, getPrincipal());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/invite")
    public ResponseEntity<InviteResponse> invite(
            @PathVariable UUID id,
            @Valid @RequestBody InviteUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(communityService.inviteUser(id, request.userId(), getPrincipal()));
    }

    @PostMapping("/{id}/invites/{inviteId}/accept")
    public ResponseEntity<Void> acceptInvite(
            @PathVariable UUID id,
            @PathVariable UUID inviteId) {
        communityService.acceptInvite(id, inviteId, getPrincipal());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/invites/{inviteId}/decline")
    public ResponseEntity<Void> declineInvite(
            @PathVariable UUID id,
            @PathVariable UUID inviteId) {
        communityService.declineInvite(id, inviteId, getPrincipal());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<CommunityMemberResponse>> getMembers(
            @PathVariable UUID id,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role) {
        return ResponseEntity.ok(communityService.getMembers(id, search, role));
    }

    @GetMapping("/{id}/invites")
    public ResponseEntity<List<InviteResponse>> getInvites(@PathVariable UUID id) {
        return ResponseEntity.ok(communityService.getInvites(id, getPrincipal()));
    }

    @GetMapping("/my")
    public ResponseEntity<List<CommunityResponse>> getMyCommunities() {
        return ResponseEntity.ok(communityService.getMyCommunities(getPrincipal()));
    }

    @GetMapping("/invites")
    public ResponseEntity<List<InviteResponse>> getMyInvites() {
        return ResponseEntity.ok(communityService.getMyInvites(getPrincipal()));
    }

    @PutMapping("/{id}/transfer-ownership/{userId}")
    public ResponseEntity<Void> transferOwnership(
            @PathVariable UUID id,
            @PathVariable UUID userId) {
        communityService.transferOwnership(id, userId, getPrincipal());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/members/{userId}/role")
    public ResponseEntity<Void> updateMemberRole(
            @PathVariable UUID id,
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateMemberRoleRequest request) {
        communityService.updateMemberRole(id, userId, request.role(), getPrincipal());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/rules")
    public ResponseEntity<List<CommunityRuleResponse>> getRules(@PathVariable UUID id) {
        return ResponseEntity.ok(communityService.getRules(id));
    }

    @PostMapping("/{id}/rules")
    public ResponseEntity<CommunityRuleResponse> createRule(
            @PathVariable UUID id,
            @Valid @RequestBody CreateRuleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(communityService.createRule(id, request, getPrincipal()));
    }

    @PutMapping("/{id}/rules/{ruleId}")
    public ResponseEntity<CommunityRuleResponse> updateRule(
            @PathVariable UUID id,
            @PathVariable UUID ruleId,
            @Valid @RequestBody UpdateRuleRequest request) {
        return ResponseEntity.ok(communityService.updateRule(id, ruleId, request, getPrincipal()));
    }

    @DeleteMapping("/{id}/rules/{ruleId}")
    public ResponseEntity<Void> deleteRule(
            @PathVariable UUID id,
            @PathVariable UUID ruleId) {
        communityService.deleteRule(id, ruleId, getPrincipal());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/join-requests")
    public ResponseEntity<List<JoinRequestResponse>> getJoinRequests(@PathVariable UUID id) {
        return ResponseEntity.ok(communityService.getJoinRequests(id, getPrincipal()));
    }

    @GetMapping("/{id}/my-join-request")
    public ResponseEntity<JoinRequestResponse> getMyJoinRequest(@PathVariable UUID id) {
        return communityService.getMyJoinRequest(id, getPrincipal())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping("/{id}/join-requests/{requestId}/approve")
    public ResponseEntity<Void> approveJoinRequest(
            @PathVariable UUID id,
            @PathVariable UUID requestId) {
        communityService.approveJoinRequest(id, requestId, getPrincipal());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/join-requests/{requestId}/reject")
    public ResponseEntity<Void> rejectJoinRequest(
            @PathVariable UUID id,
            @PathVariable UUID requestId) {
        communityService.rejectJoinRequest(id, requestId, getPrincipal());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/invite-links")
    public ResponseEntity<InviteLinkResponse> createInviteLink(
            @PathVariable UUID id,
            @Valid @RequestBody CreateInviteLinkRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(communityService.createInviteLink(id, request, getPrincipal()));
    }

    @GetMapping("/{id}/invite-links")
    public ResponseEntity<List<InviteLinkResponse>> getInviteLinks(@PathVariable UUID id) {
        return ResponseEntity.ok(communityService.getInviteLinks(id, getPrincipal()));
    }

    @DeleteMapping("/{id}/invite-links/{linkId}")
    public ResponseEntity<Void> revokeInviteLink(
            @PathVariable UUID id,
            @PathVariable UUID linkId) {
        communityService.revokeInviteLink(id, linkId, getPrincipal());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/join-by-link/{code}")
    public ResponseEntity<Void> joinByInviteLink(@PathVariable String code) {
        communityService.joinByInviteLink(code, getPrincipal());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID id,
            @PathVariable UUID userId) {
        communityService.removeMember(id, userId, getPrincipal());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/bans")
    public ResponseEntity<BanResponse> banMember(
            @PathVariable UUID id,
            @PathVariable UUID userId,
            @Valid @RequestBody BanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(communityService.banMember(id, userId, request.reason(), request.duration(), getPrincipal()));
    }

    @PostMapping("/{id}/unban/{userId}")
    public ResponseEntity<Void> unbanMember(
            @PathVariable UUID id,
            @PathVariable UUID userId) {
        communityService.unbanMember(id, userId, getPrincipal());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/bans")
    public ResponseEntity<List<BanResponse>> getBans(@PathVariable UUID id) {
        return ResponseEntity.ok(communityService.getBans(id, getPrincipal()));
    }

    @GetMapping("/{id}/mod-log")
    public ResponseEntity<List<ModLogResponse>> getModLog(@PathVariable UUID id) {
        return ResponseEntity.ok(communityService.getModLog(id, getPrincipal()));
    }

    @GetMapping("/{id}/analytics")
    public ResponseEntity<CommunityAnalyticsResponse> getAnalytics(@PathVariable UUID id) {
        return ResponseEntity.ok(communityService.getAnalytics(id, getPrincipal()));
    }

    @GetMapping("/{id}/tags")
    public ResponseEntity<List<CommunityTagResponse>> getTags(@PathVariable UUID id) {
        return ResponseEntity.ok(communityService.getTags(id));
    }

    @PostMapping("/{id}/tags")
    public ResponseEntity<CommunityTagResponse> createTag(
            @PathVariable UUID id,
            @Valid @RequestBody CommunityTagRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(communityService.createTag(id, request, getPrincipal()));
    }

    @DeleteMapping("/{id}/tags/{tagId}")
    public ResponseEntity<Void> deleteTag(
            @PathVariable UUID id,
            @PathVariable UUID tagId) {
        communityService.deleteTag(id, tagId, getPrincipal());
        return ResponseEntity.noContent().build();
    }

    private AuthPrincipal getPrincipal() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthPrincipal) {
            return (AuthPrincipal) auth.getPrincipal();
        }
        return null;
    }
}
