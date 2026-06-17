package com.community.community;

import com.community.auth.AuthPrincipal;
import com.community.community.dto.*;
import com.community.community.dto.CommunityAnalyticsResponse;
import com.community.comment.CommentRepository;
import com.community.notification.NotificationService;
import com.community.notification.NotificationType;
import com.community.post.PostRepository;
import com.community.post.PostStatus;
import com.community.user.User;
import com.community.user.UserProfileRepository;
import com.community.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CommunityService {

    private final CommunityRepository communityRepository;
    private final CommunityMemberRepository memberRepository;
    private final CommunityInviteRepository inviteRepository;
    private final CommunityRuleRepository ruleRepository;
    private final CommunityJoinRequestRepository joinRequestRepository;
    private final CommunityInviteLinkRepository inviteLinkRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final CommunityBanRepository banRepository;
    private final ModerationLogRepository modLogRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final NotificationService notificationService;
    private final CommunityTagRepository communityTagRepository;

    private static final String ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    public CommunityService(CommunityRepository communityRepository,
                            CommunityMemberRepository memberRepository,
                            CommunityInviteRepository inviteRepository,
                            CommunityRuleRepository ruleRepository,
                            CommunityJoinRequestRepository joinRequestRepository,
                            CommunityInviteLinkRepository inviteLinkRepository,
                            UserRepository userRepository,
                            UserProfileRepository userProfileRepository,
                            CommunityBanRepository banRepository,
                            ModerationLogRepository modLogRepository,
                            PostRepository postRepository,
                            CommentRepository commentRepository,
                            NotificationService notificationService,
                            CommunityTagRepository communityTagRepository) {
        this.communityRepository = communityRepository;
        this.memberRepository = memberRepository;
        this.inviteRepository = inviteRepository;
        this.ruleRepository = ruleRepository;
        this.joinRequestRepository = joinRequestRepository;
        this.inviteLinkRepository = inviteLinkRepository;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.banRepository = banRepository;
        this.modLogRepository = modLogRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.notificationService = notificationService;
        this.communityTagRepository = communityTagRepository;
    }

    public String slugify(String name) {
        if (name == null) {
            return "";
        }
        String slug = name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        return slug;
    }

    @Transactional
    public CommunityResponse create(AuthPrincipal principal, CreateCommunityRequest request) {
        User owner = findUserById(principal.userId());

        CommunityVisibility visibility = CommunityVisibility.PUBLIC;
        if (request.visibility() != null) {
            try {
                visibility = CommunityVisibility.valueOf(request.visibility().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid visibility: must be PUBLIC, RESTRICTED, or PRIVATE");
            }
        }

        String slug = request.slug();
        if (slug == null || slug.trim().isEmpty()) {
            slug = slugify(request.name());
        } else {
            slug = slug.toLowerCase().trim();
            if (!slug.matches("^[a-z0-9-]+$")) {
                throw new IllegalArgumentException("Slug must contain only lowercase letters, numbers, and hyphens");
            }
        }

        if (slug.isEmpty()) {
            slug = "community-" + UUID.randomUUID().toString().substring(0, 8);
        }

        if (communityRepository.existsBySlug(slug)) {
            if (request.slug() != null && !request.slug().trim().isEmpty()) {
                throw new IllegalArgumentException("Community URL slug is already taken");
            }
            String baseSlug = slug;
            int attempts = 0;
            do {
                slug = baseSlug + "-" + (RANDOM.nextInt(9000) + 1000);
                attempts++;
            } while (communityRepository.existsBySlug(slug) && attempts < 10);
            if (attempts >= 10) {
                slug = baseSlug + "-" + UUID.randomUUID().toString().substring(0, 8);
            }
        }

        Community community = new Community();
        community.setName(request.name());
        community.setDescription(request.description());
        community.setVisibility(visibility);
        community.setOwner(owner);
        community.setSlug(slug);
        community.setMemberCount(1);
        communityRepository.save(community);

        CommunityMember member = new CommunityMember();
        member.setCommunity(community);
        member.setUser(owner);
        member.setRole(CommunityRole.OWNER);
        memberRepository.save(member);

        return toResponse(community, true, CommunityRole.OWNER);
    }

    @Transactional(readOnly = true)
    public CommunityResponse getCommunityBySlug(String slug, AuthPrincipal principal) {
        Community community = communityRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Community not found"));

        if (community.getVisibility() == CommunityVisibility.PRIVATE) {
            if (principal == null) {
                throw new IllegalArgumentException("Community is private");
            }
            boolean isMember = memberRepository.existsByCommunityIdAndUserId(community.getId(), UUID.fromString(principal.userId()));
            if (!isMember) {
                throw new IllegalArgumentException("Community is private");
            }
        }

        boolean isMember = false;
        CommunityRole role = null;
        if (principal != null) {
            var membership = memberRepository.findByCommunityIdAndUserId(community.getId(), UUID.fromString(principal.userId()));
            isMember = membership.isPresent();
            role = membership.map(CommunityMember::getRole).orElse(null);
        }

        return toResponse(community, isMember, role);
    }

    @Transactional(readOnly = true)
    public Page<CommunityResponse> getPublicCommunities(AuthPrincipal principal, Pageable pageable) {
        Page<Community> communities = communityRepository.findByVisibilityIn(
                List.of(CommunityVisibility.PUBLIC, CommunityVisibility.RESTRICTED), pageable);
        return communities.map(c -> {
            boolean isMember = false;
            CommunityRole role = null;
            if (principal != null) {
                var membership = memberRepository.findByCommunityIdAndUserId(c.getId(), UUID.fromString(principal.userId()));
                isMember = membership.isPresent();
                role = membership.map(CommunityMember::getRole).orElse(null);
            }
            return toResponse(c, isMember, role);
        });
    }

    @Transactional(readOnly = true)
    public CommunityResponse getCommunityById(UUID communityId, AuthPrincipal principal) {
        Community community = findCommunityById(communityId);

        if (community.getVisibility() == CommunityVisibility.PRIVATE) {
            if (principal == null) {
                throw new IllegalArgumentException("Community is private");
            }
            boolean isMember = memberRepository.existsByCommunityIdAndUserId(communityId, UUID.fromString(principal.userId()));
            if (!isMember) {
                throw new IllegalArgumentException("Community is private");
            }
        }

        boolean isMember = false;
        CommunityRole role = null;
        if (principal != null) {
            var membership = memberRepository.findByCommunityIdAndUserId(communityId, UUID.fromString(principal.userId()));
            isMember = membership.isPresent();
            role = membership.map(CommunityMember::getRole).orElse(null);
        }

        return toResponse(community, isMember, role);
    }

    @Transactional
    public CommunityResponse updateCommunity(UUID communityId, AuthPrincipal principal, UpdateCommunityRequest request) {
        Community community = findCommunityById(communityId);
        CommunityMember member = findMemberOrThrow(communityId, UUID.fromString(principal.userId()));

        if (member.getRole() != CommunityRole.OWNER && member.getRole() != CommunityRole.ADMIN && member.getRole() != CommunityRole.MOD) {
            throw new IllegalArgumentException("Only the owner, admins, or moderators can update this community");
        }

        if (request.name() != null) {
            community.setName(request.name());
        }
        if (request.description() != null) {
            community.setDescription(request.description());
        }
        if (request.visibility() != null) {
            try {
                community.setVisibility(CommunityVisibility.valueOf(request.visibility().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid visibility: must be PUBLIC, RESTRICTED, or PRIVATE");
            }
        }
        if (request.avatarUrl() != null) {
            community.setAvatarUrl(request.avatarUrl().isEmpty() ? null : request.avatarUrl());
        }
        if (request.bannerUrl() != null) {
            community.setBannerUrl(request.bannerUrl().isEmpty() ? null : request.bannerUrl());
        }

        communityRepository.save(community);
        return toResponse(community, true, member.getRole());
    }

    @Transactional
    public void deleteCommunity(UUID communityId, AuthPrincipal principal) {
        Community community = findCommunityById(communityId);
        CommunityMember member = findMemberOrThrow(communityId, UUID.fromString(principal.userId()));

        if (member.getRole() != CommunityRole.OWNER) {
            throw new IllegalArgumentException("Only the owner can delete this community");
        }

        communityRepository.delete(community);
    }

    @Transactional
    public void joinCommunity(UUID communityId, AuthPrincipal principal) {
        Community community = findCommunityById(communityId);

        UUID userId = UUID.fromString(principal.userId());
        if (memberRepository.existsByCommunityIdAndUserId(communityId, userId)) {
            throw new IllegalArgumentException("Already a member of this community");
        }

        if (community.getVisibility() == CommunityVisibility.PRIVATE) {
            if (joinRequestRepository.existsByCommunityIdAndUserIdAndStatus(communityId, userId, JoinRequestStatus.PENDING)) {
                throw new IllegalArgumentException("Already have a pending join request");
            }

            User user = findUserById(principal.userId());
            CommunityJoinRequest request = new CommunityJoinRequest();
            request.setCommunity(community);
            request.setUser(user);
            joinRequestRepository.save(request);
            return;
        }

        User user = findUserById(principal.userId());
        CommunityMember member = new CommunityMember();
        member.setCommunity(community);
        member.setUser(user);
        member.setRole(CommunityRole.MEMBER);
        memberRepository.save(member);

        community.setMemberCount(community.getMemberCount() + 1);
        communityRepository.save(community);
    }

    @Transactional
    public void leaveCommunity(UUID communityId, AuthPrincipal principal) {
        Community community = findCommunityById(communityId);
        UUID userId = UUID.fromString(principal.userId());

        CommunityMember member = findMemberOrThrow(communityId, userId);

        if (member.getRole() == CommunityRole.OWNER) {
            throw new IllegalArgumentException("Owner cannot leave the community. Transfer ownership or delete the community first.");
        }

        memberRepository.delete(member);
        community.setMemberCount(Math.max(0, community.getMemberCount() - 1));
        communityRepository.save(community);
    }

    @Transactional
    public InviteResponse inviteUser(UUID communityId, UUID targetUserId, AuthPrincipal principal) {
        Community community = findCommunityById(communityId);
        CommunityMember inviter = findMemberOrThrow(communityId, UUID.fromString(principal.userId()));

        if (inviter.getRole() != CommunityRole.OWNER && inviter.getRole() != CommunityRole.ADMIN) {
            throw new IllegalArgumentException("Only the owner or admins can invite users");
        }

        User invitee = findUserById(targetUserId.toString());

        if (memberRepository.existsByCommunityIdAndUserId(communityId, targetUserId)) {
            throw new IllegalArgumentException("User is already a member of this community");
        }

        if (inviteRepository.existsByCommunityIdAndInviteeIdAndStatus(communityId, targetUserId, InviteStatus.PENDING)) {
            throw new IllegalArgumentException("User already has a pending invite");
        }

        User inviterUser = findUserById(principal.userId());

        CommunityInvite invite = new CommunityInvite();
        invite.setCommunity(community);
        invite.setInviter(inviterUser);
        invite.setInvitee(invitee);
        invite.setStatus(InviteStatus.PENDING);
        inviteRepository.save(invite);

        notificationService.createNotification(
                targetUserId,
                NotificationType.INVITE,
                community.getId(),
                "community",
                UUID.fromString(principal.userId()),
                inviterUser.getUsername() + " invited you to join " + community.getName()
        );

        return toInviteResponse(invite);
    }

    @Transactional
    public void acceptInvite(UUID communityId, UUID inviteId, AuthPrincipal principal) {
        CommunityInvite invite = inviteRepository.findById(inviteId)
                .orElseThrow(() -> new IllegalArgumentException("Invite not found"));

        if (!invite.getCommunity().getId().equals(communityId)) {
            throw new IllegalArgumentException("Invite does not belong to this community");
        }

        UUID userId = UUID.fromString(principal.userId());
        if (!invite.getInvitee().getId().equals(userId)) {
            throw new IllegalArgumentException("This invite is not for you");
        }

        if (invite.getStatus() != InviteStatus.PENDING) {
            throw new IllegalArgumentException("Invite is no longer pending");
        }

        if (invite.getExpiresAt().isBefore(java.time.Instant.now())) {
            invite.setStatus(InviteStatus.EXPIRED);
            inviteRepository.save(invite);
            throw new IllegalArgumentException("Invite has expired");
        }

        invite.setStatus(InviteStatus.ACCEPTED);
        inviteRepository.save(invite);

        Community community = invite.getCommunity();
        User user = invite.getInvitee();

        CommunityMember member = new CommunityMember();
        member.setCommunity(community);
        member.setUser(user);
        member.setRole(CommunityRole.MEMBER);
        memberRepository.save(member);

        community.setMemberCount(community.getMemberCount() + 1);
        communityRepository.save(community);
    }

    @Transactional
    public void declineInvite(UUID communityId, UUID inviteId, AuthPrincipal principal) {
        CommunityInvite invite = inviteRepository.findById(inviteId)
                .orElseThrow(() -> new IllegalArgumentException("Invite not found"));

        if (!invite.getCommunity().getId().equals(communityId)) {
            throw new IllegalArgumentException("Invite does not belong to this community");
        }

        UUID userId = UUID.fromString(principal.userId());
        if (!invite.getInvitee().getId().equals(userId)) {
            throw new IllegalArgumentException("This invite is not for you");
        }

        invite.setStatus(InviteStatus.DECLINED);
        inviteRepository.save(invite);
    }

    @Transactional(readOnly = true)
    public List<CommunityMemberResponse> getMembers(UUID communityId, String search, String roleFilter) {
        Community community = findCommunityById(communityId);
        return memberRepository.findByCommunityId(communityId).stream()
                .filter(m -> roleFilter == null || roleFilter.isEmpty() || m.getRole().name().equalsIgnoreCase(roleFilter))
                .filter(m -> search == null || search.isEmpty() || m.getUser().getUsername().toLowerCase().contains(search.toLowerCase()))
                .map(this::toMemberResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InviteResponse> getInvites(UUID communityId, AuthPrincipal principal) {
        Community community = findCommunityById(communityId);
        CommunityMember member = findMemberOrThrow(communityId, UUID.fromString(principal.userId()));

        if (member.getRole() != CommunityRole.OWNER && member.getRole() != CommunityRole.ADMIN && member.getRole() != CommunityRole.MOD) {
            throw new IllegalArgumentException("Only the owner, admins, or moderators can view invites");
        }

        return inviteRepository.findByCommunityId(communityId).stream()
                .map(this::toInviteResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InviteResponse> getMyInvites(AuthPrincipal principal) {
        UUID userId = UUID.fromString(principal.userId());
        return inviteRepository.findByInviteeIdAndStatus(userId, InviteStatus.PENDING).stream()
                .map(this::toInviteResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CommunityResponse> getMyCommunities(AuthPrincipal principal) {
        UUID userId = UUID.fromString(principal.userId());
        return memberRepository.findByUserId(userId).stream()
                .map(m -> toResponse(m.getCommunity(), true, m.getRole()))
                .toList();
    }

    @Transactional
    public void transferOwnership(UUID communityId, UUID targetUserId, AuthPrincipal principal) {
        Community community = findCommunityById(communityId);
        CommunityMember currentOwner = findMemberOrThrow(communityId, UUID.fromString(principal.userId()));

        if (currentOwner.getRole() != CommunityRole.OWNER) {
            throw new IllegalArgumentException("Only the owner can transfer ownership");
        }

        CommunityMember targetMember = findMemberOrThrow(communityId, targetUserId);

        currentOwner.setRole(CommunityRole.ADMIN);
        memberRepository.save(currentOwner);

        targetMember.setRole(CommunityRole.OWNER);
        memberRepository.save(targetMember);

        community.setOwner(targetMember.getUser());
        communityRepository.save(community);
    }

    @Transactional
    public void updateMemberRole(UUID communityId, UUID targetUserId, String newRole, AuthPrincipal principal) {
        Community community = findCommunityById(communityId);
        UUID actorUserId = UUID.fromString(principal.userId());
        CommunityMember actor = findMemberOrThrow(communityId, actorUserId);

        if (actor.getRole() != CommunityRole.OWNER && actor.getRole() != CommunityRole.ADMIN) {
            throw new IllegalArgumentException("Only the owner or admins can change roles");
        }

        if (actorUserId.equals(targetUserId)) {
            throw new IllegalArgumentException("You cannot change your own role");
        }

        CommunityMember target = findMemberOrThrow(communityId, targetUserId);

        if (target.getRole() == CommunityRole.OWNER) {
            throw new IllegalArgumentException("Cannot change the owner's role");
        }

        CommunityRole role;
        try {
            role = CommunityRole.valueOf(newRole.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: must be ADMIN, MOD, or MEMBER");
        }

        if (role == CommunityRole.OWNER) {
            throw new IllegalArgumentException("Use the transfer ownership endpoint to change owner");
        }

        if (role == CommunityRole.ADMIN && actor.getRole() != CommunityRole.OWNER) {
            throw new IllegalArgumentException("Only the owner can promote to admin");
        }

        if (target.getRole() == CommunityRole.ADMIN && actor.getRole() != CommunityRole.OWNER) {
            throw new IllegalArgumentException("Only the owner can demote an admin");
        }

        target.setRole(role);
        memberRepository.save(target);
    }

    // --- Rules ---

    @Transactional(readOnly = true)
    public List<CommunityRuleResponse> getRules(UUID communityId) {
        return ruleRepository.findByCommunityIdOrderByPositionAsc(communityId).stream()
                .map(this::toRuleResponse)
                .toList();
    }

    @Transactional
    public CommunityRuleResponse createRule(UUID communityId, CreateRuleRequest request, AuthPrincipal principal) {
        Community community = findCommunityById(communityId);
        CommunityMember actor = findMemberOrThrow(communityId, UUID.fromString(principal.userId()));

        if (actor.getRole() != CommunityRole.OWNER && actor.getRole() != CommunityRole.ADMIN && actor.getRole() != CommunityRole.MOD) {
            throw new IllegalArgumentException("Only the owner, admins, or moderators can create rules");
        }

        CommunityRule rule = new CommunityRule();
        rule.setCommunity(community);
        rule.setTitle(request.title());
        rule.setDescription(request.description());
        rule.setPosition(request.position());
        ruleRepository.save(rule);

        return toRuleResponse(rule);
    }

    @Transactional
    public CommunityRuleResponse updateRule(UUID communityId, UUID ruleId, UpdateRuleRequest request, AuthPrincipal principal) {
        Community community = findCommunityById(communityId);
        CommunityMember actor = findMemberOrThrow(communityId, UUID.fromString(principal.userId()));

        if (actor.getRole() != CommunityRole.OWNER && actor.getRole() != CommunityRole.ADMIN && actor.getRole() != CommunityRole.MOD) {
            throw new IllegalArgumentException("Only the owner, admins, or moderators can update rules");
        }

        CommunityRule rule = ruleRepository.findById(ruleId)
                .orElseThrow(() -> new IllegalArgumentException("Rule not found"));

        if (!rule.getCommunity().getId().equals(communityId)) {
            throw new IllegalArgumentException("Rule does not belong to this community");
        }

        if (request.title() != null) {
            rule.setTitle(request.title());
        }
        if (request.description() != null) {
            rule.setDescription(request.description());
        }
        if (request.position() != null) {
            rule.setPosition(request.position());
        }

        ruleRepository.save(rule);
        return toRuleResponse(rule);
    }

    @Transactional
    public void deleteRule(UUID communityId, UUID ruleId, AuthPrincipal principal) {
        Community community = findCommunityById(communityId);
        CommunityMember actor = findMemberOrThrow(communityId, UUID.fromString(principal.userId()));

        if (actor.getRole() != CommunityRole.OWNER && actor.getRole() != CommunityRole.ADMIN && actor.getRole() != CommunityRole.MOD) {
            throw new IllegalArgumentException("Only the owner, admins, or moderators can delete rules");
        }

        CommunityRule rule = ruleRepository.findById(ruleId)
                .orElseThrow(() -> new IllegalArgumentException("Rule not found"));

        if (!rule.getCommunity().getId().equals(communityId)) {
            throw new IllegalArgumentException("Rule does not belong to this community");
        }

        ruleRepository.delete(rule);
    }

    // --- Join Requests ---

    @Transactional(readOnly = true)
    public List<JoinRequestResponse> getJoinRequests(UUID communityId, AuthPrincipal principal) {
        Community community = findCommunityById(communityId);
        CommunityMember actor = findMemberOrThrow(communityId, UUID.fromString(principal.userId()));

        if (actor.getRole() != CommunityRole.OWNER && actor.getRole() != CommunityRole.ADMIN && actor.getRole() != CommunityRole.MOD) {
            throw new IllegalArgumentException("Only the owner, admins, or moderators can view join requests");
        }

        return joinRequestRepository.findByCommunityIdOrderByCreatedAtDesc(communityId).stream()
                .map(this::toJoinRequestResponse)
                .toList();
    }

    @Transactional
    public void approveJoinRequest(UUID communityId, UUID requestId, AuthPrincipal principal) {
        Community community = findCommunityById(communityId);
        CommunityMember actor = findMemberOrThrow(communityId, UUID.fromString(principal.userId()));

        if (actor.getRole() != CommunityRole.OWNER && actor.getRole() != CommunityRole.ADMIN && actor.getRole() != CommunityRole.MOD) {
            throw new IllegalArgumentException("Only the owner, admins, or moderators can approve requests");
        }

        CommunityJoinRequest joinRequest = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Join request not found"));

        if (!joinRequest.getCommunity().getId().equals(communityId)) {
            throw new IllegalArgumentException("Join request does not belong to this community");
        }

        if (joinRequest.getStatus() != JoinRequestStatus.PENDING) {
            throw new IllegalArgumentException("Join request is no longer pending");
        }

        joinRequest.setStatus(JoinRequestStatus.APPROVED);
        joinRequestRepository.save(joinRequest);

        User user = joinRequest.getUser();
        CommunityMember member = new CommunityMember();
        member.setCommunity(community);
        member.setUser(user);
        member.setRole(CommunityRole.MEMBER);
        memberRepository.save(member);

        community.setMemberCount(community.getMemberCount() + 1);
        communityRepository.save(community);
    }

    @Transactional
    public void rejectJoinRequest(UUID communityId, UUID requestId, AuthPrincipal principal) {
        Community community = findCommunityById(communityId);
        CommunityMember actor = findMemberOrThrow(communityId, UUID.fromString(principal.userId()));

        if (actor.getRole() != CommunityRole.OWNER && actor.getRole() != CommunityRole.ADMIN && actor.getRole() != CommunityRole.MOD) {
            throw new IllegalArgumentException("Only the owner, admins, or moderators can reject requests");
        }

        CommunityJoinRequest joinRequest = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Join request not found"));

        if (!joinRequest.getCommunity().getId().equals(communityId)) {
            throw new IllegalArgumentException("Join request does not belong to this community");
        }

        if (joinRequest.getStatus() != JoinRequestStatus.PENDING) {
            throw new IllegalArgumentException("Join request is no longer pending");
        }

        joinRequest.setStatus(JoinRequestStatus.REJECTED);
        joinRequestRepository.save(joinRequest);
    }

    @Transactional(readOnly = true)
    public Optional<JoinRequestResponse> getMyJoinRequest(UUID communityId, AuthPrincipal principal) {
        UUID userId = UUID.fromString(principal.userId());
        return joinRequestRepository.findByCommunityIdAndUserId(communityId, userId)
                .map(this::toJoinRequestResponse);
    }

    // --- Invite Links ---

    @Transactional
    public InviteLinkResponse createInviteLink(UUID communityId, CreateInviteLinkRequest request, AuthPrincipal principal) {
        Community community = findCommunityById(communityId);
        CommunityMember actor = findMemberOrThrow(communityId, UUID.fromString(principal.userId()));

        if (actor.getRole() != CommunityRole.OWNER && actor.getRole() != CommunityRole.ADMIN) {
            throw new IllegalArgumentException("Only the owner or admins can create invite links");
        }

        User creator = findUserById(principal.userId());

        CommunityInviteLink link = new CommunityInviteLink();
        link.setCommunity(community);
        link.setCode(generateInviteCode());
        link.setCreatedBy(creator);

        if (request.expiresAt() != null) {
            link.setExpiresAt(Instant.parse(request.expiresAt()));
        }
        if (request.maxUses() != null) {
            link.setMaxUses(request.maxUses());
        }

        inviteLinkRepository.save(link);
        return toInviteLinkResponse(link);
    }

    @Transactional(readOnly = true)
    public List<InviteLinkResponse> getInviteLinks(UUID communityId, AuthPrincipal principal) {
        Community community = findCommunityById(communityId);
        CommunityMember actor = findMemberOrThrow(communityId, UUID.fromString(principal.userId()));

        if (actor.getRole() != CommunityRole.OWNER && actor.getRole() != CommunityRole.ADMIN) {
            throw new IllegalArgumentException("Only the owner or admins can view invite links");
        }

        return inviteLinkRepository.findByCommunityIdOrderByCreatedAtDesc(communityId).stream()
                .map(this::toInviteLinkResponse)
                .toList();
    }

    @Transactional
    public void revokeInviteLink(UUID communityId, UUID linkId, AuthPrincipal principal) {
        Community community = findCommunityById(communityId);
        CommunityMember actor = findMemberOrThrow(communityId, UUID.fromString(principal.userId()));

        if (actor.getRole() != CommunityRole.OWNER && actor.getRole() != CommunityRole.ADMIN) {
            throw new IllegalArgumentException("Only the owner or admins can revoke invite links");
        }

        CommunityInviteLink link = inviteLinkRepository.findById(linkId)
                .orElseThrow(() -> new IllegalArgumentException("Invite link not found"));

        if (!link.getCommunity().getId().equals(communityId)) {
            throw new IllegalArgumentException("Invite link does not belong to this community");
        }

        link.setActive(false);
        inviteLinkRepository.save(link);
    }

    @Transactional
    public void joinByInviteLink(String code, AuthPrincipal principal) {
        CommunityInviteLink link = inviteLinkRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Invite link not found"));

        if (!link.isActive()) {
            throw new IllegalArgumentException("Invite link is no longer active");
        }

        if (link.getExpiresAt() != null && link.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Invite link has expired");
        }

        if (link.getMaxUses() != null && link.getUseCount() >= link.getMaxUses()) {
            throw new IllegalArgumentException("Invite link has reached maximum uses");
        }

        Community community = link.getCommunity();
        UUID userId = UUID.fromString(principal.userId());

        if (memberRepository.existsByCommunityIdAndUserId(community.getId(), userId)) {
            throw new IllegalArgumentException("Already a member of this community");
        }

        User user = findUserById(principal.userId());
        CommunityMember member = new CommunityMember();
        member.setCommunity(community);
        member.setUser(user);
        member.setRole(CommunityRole.MEMBER);
        memberRepository.save(member);

        community.setMemberCount(community.getMemberCount() + 1);
        communityRepository.save(community);

        link.setUseCount(link.getUseCount() + 1);
        inviteLinkRepository.save(link);
    }

    // --- Moderation ---

    private boolean isModerator(CommunityMember member) {
        return member.getRole() == CommunityRole.OWNER
            || member.getRole() == CommunityRole.ADMIN
            || member.getRole() == CommunityRole.MOD;
    }

    private void logAction(UUID communityId, UUID actorId, ModAction action, UUID targetId, String targetType, String details) {
        Community community = communityRepository.findById(communityId).orElse(null);
        if (community == null) return;
        User actor = userRepository.findById(actorId).orElse(null);
        if (actor == null) return;
        ModerationLog log = new ModerationLog();
        log.setCommunity(community);
        log.setActor(actor);
        log.setAction(action);
        log.setTargetId(targetId);
        log.setTargetType(targetType);
        log.setDetails(details);
        modLogRepository.save(log);
    }

    @Transactional
    public void removeMember(UUID communityId, UUID targetUserId, AuthPrincipal principal) {
        CommunityMember actor = findMemberOrThrow(communityId, UUID.fromString(principal.userId()));
        if (!isModerator(actor)) {
            throw new IllegalArgumentException("Only moderators can remove members");
        }
        if (actor.getUser().getId().equals(targetUserId)) {
            throw new IllegalArgumentException("You cannot remove yourself");
        }
        CommunityMember target = findMemberOrThrow(communityId, targetUserId);
        if (target.getRole() == CommunityRole.OWNER) {
            throw new IllegalArgumentException("Cannot remove the owner");
        }
        if (target.getRole() == CommunityRole.ADMIN && actor.getRole() != CommunityRole.OWNER) {
            throw new IllegalArgumentException("Only the owner can remove an admin");
        }
        memberRepository.delete(target);
        Community community = findCommunityById(communityId);
        community.setMemberCount(Math.max(0, community.getMemberCount() - 1));
        communityRepository.save(community);
        logAction(communityId, UUID.fromString(principal.userId()), ModAction.MEMBER_REMOVED, targetUserId, "user", "Removed " + target.getUser().getUsername());
    }

    @Transactional
    public BanResponse banMember(UUID communityId, UUID targetUserId, String reason, String duration, AuthPrincipal principal) {
        CommunityMember actor = findMemberOrThrow(communityId, UUID.fromString(principal.userId()));
        if (!isModerator(actor)) {
            throw new IllegalArgumentException("Only moderators can ban members");
        }
        if (actor.getUser().getId().equals(targetUserId)) {
            throw new IllegalArgumentException("You cannot ban yourself");
        }
        CommunityMember target = findMemberOrThrow(communityId, targetUserId);
        if (target.getRole() == CommunityRole.OWNER) {
            throw new IllegalArgumentException("Cannot ban the owner");
        }
        if (target.getRole() == CommunityRole.ADMIN && actor.getRole() != CommunityRole.OWNER) {
            throw new IllegalArgumentException("Only the owner can ban an admin");
        }

        if (banRepository.existsByCommunityIdAndUserId(communityId, targetUserId)) {
            throw new IllegalArgumentException("User is already banned");
        }

        User banner = findUserById(principal.userId());
        Community community = findCommunityById(communityId);

        Instant expiresAt = null;
        if (duration != null && !duration.isEmpty()) {
            expiresAt = Instant.now().plusSeconds(Long.parseLong(duration));
        }

        CommunityBan ban = new CommunityBan();
        ban.setCommunity(community);
        ban.setUser(target.getUser());
        ban.setBannedBy(banner);
        ban.setReason(reason);
        ban.setDuration(duration);
        ban.setExpiresAt(expiresAt);
        banRepository.save(ban);

        memberRepository.delete(target);
        community.setMemberCount(Math.max(0, community.getMemberCount() - 1));
        communityRepository.save(community);

        String details = "Banned " + target.getUser().getUsername();
        if (reason != null && !reason.isEmpty()) details += ": " + reason;
        logAction(communityId, UUID.fromString(principal.userId()), ModAction.MEMBER_BANNED, targetUserId, "user", details);

        return toBanResponse(ban);
    }

    @Transactional
    public void unbanMember(UUID communityId, UUID targetUserId, AuthPrincipal principal) {
        CommunityMember actor = findMemberOrThrow(communityId, UUID.fromString(principal.userId()));
        if (actor.getRole() != CommunityRole.OWNER && actor.getRole() != CommunityRole.ADMIN) {
            throw new IllegalArgumentException("Only the owner or admins can unban users");
        }
        CommunityBan ban = banRepository.findByCommunityIdAndUserId(communityId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Ban not found"));
        banRepository.delete(ban);
        logAction(communityId, UUID.fromString(principal.userId()), ModAction.MEMBER_UNBANNED, targetUserId, "user", "Unbanned " + ban.getUser().getUsername());
    }

    @Transactional(readOnly = true)
    public List<BanResponse> getBans(UUID communityId, AuthPrincipal principal) {
        CommunityMember actor = findMemberOrThrow(communityId, UUID.fromString(principal.userId()));
        if (!isModerator(actor)) {
            throw new IllegalArgumentException("Only moderators can view bans");
        }
        return banRepository.findByCommunityIdOrderByCreatedAtDesc(communityId).stream()
                .map(this::toBanResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ModLogResponse> getModLog(UUID communityId, AuthPrincipal principal) {
        CommunityMember actor = findMemberOrThrow(communityId, UUID.fromString(principal.userId()));
        if (!isModerator(actor)) {
            throw new IllegalArgumentException("Only moderators can view the moderation log");
        }
        return modLogRepository.findByCommunityIdOrderByCreatedAtDesc(communityId).stream()
                .map(this::toModLogResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean isBanned(UUID communityId, UUID userId) {
        return banRepository.existsByCommunityIdAndUserId(communityId, userId);
    }

    @Transactional(readOnly = true)
    public CommunityAnalyticsResponse getAnalytics(UUID communityId, AuthPrincipal principal) {
        CommunityMember actor = findMemberOrThrow(communityId, UUID.fromString(principal.userId()));
        if (actor.getRole() != CommunityRole.OWNER && actor.getRole() != CommunityRole.ADMIN) {
            throw new IllegalArgumentException("Only the owner or admins can view analytics");
        }
        Community community = findCommunityById(communityId);
        long totalPosts = postRepository.countByCommunityId(communityId);
        long totalMembers = community.getMemberCount();
        long activeAuthors = postRepository.countDistinctActiveAuthorsByCommunityId(communityId);
        int totalComments = 0;
        var posts = postRepository.findByCommunityIdOrderByCreatedAtDesc(communityId, null, null, org.springframework.data.domain.PageRequest.of(0, 100));
        for (var post : posts) {
            totalComments += commentRepository.countByPostId(post.getId());
        }
        return new CommunityAnalyticsResponse(totalMembers, totalPosts, totalComments, activeAuthors);
    }

    // --- Helpers ---

    private String generateInviteCode() {
        StringBuilder sb = new StringBuilder(16);
        for (int i = 0; i < 16; i++) {
            sb.append(ALPHANUM.charAt(RANDOM.nextInt(ALPHANUM.length())));
        }
        return sb.toString();
    }

    private Community findCommunityById(UUID id) {
        return communityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Community not found"));
    }

    private CommunityMember findMemberOrThrow(UUID communityId, UUID userId) {
        return memberRepository.findByCommunityIdAndUserId(communityId, userId)
                .orElseThrow(() -> new IllegalArgumentException("You are not a member of this community"));
    }

    private User findUserById(String userId) {
        return userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private String getUserAvatarUrl(UUID userId) {
        return userProfileRepository.findByUserId(userId)
                .map(com.community.user.UserProfile::getAvatarUrl)
                .orElse(null);
    }

    private CommunityResponse toResponse(Community community, boolean isMember, CommunityRole role) {
        CommunityResponse.CommunityRole responseRole = CommunityResponse.CommunityRole.NONE;
        if (isMember && role != null) {
            responseRole = CommunityResponse.CommunityRole.valueOf(role.name());
        }
        return new CommunityResponse(
                community.getId(),
                community.getName(),
                community.getDescription(),
                community.getVisibility(),
                community.getOwner().getId(),
                community.getOwner().getUsername(),
                community.getMemberCount(),
                isMember,
                responseRole,
                community.getAvatarUrl(),
                community.getBannerUrl(),
                community.getSlug(),
                community.getCreatedAt(),
                community.getUpdatedAt()
        );
    }

    private CommunityMemberResponse toMemberResponse(CommunityMember member) {
        return new CommunityMemberResponse(
                member.getId(),
                member.getUser().getId(),
                member.getUser().getUsername(),
                getUserAvatarUrl(member.getUser().getId()),
                member.getRole(),
                member.getJoinedAt()
        );
    }

    private InviteResponse toInviteResponse(CommunityInvite invite) {
        return new InviteResponse(
                invite.getId(),
                invite.getCommunity().getId(),
                invite.getInviter().getId(),
                invite.getInviter().getUsername(),
                invite.getInvitee().getId(),
                invite.getInvitee().getUsername(),
                invite.getStatus(),
                invite.getCreatedAt()
        );
    }

    private CommunityRuleResponse toRuleResponse(CommunityRule rule) {
        return new CommunityRuleResponse(
                rule.getId(),
                rule.getCommunity().getId(),
                rule.getTitle(),
                rule.getDescription(),
                rule.getPosition(),
                rule.getCreatedAt()
        );
    }

    private JoinRequestResponse toJoinRequestResponse(CommunityJoinRequest request) {
        return new JoinRequestResponse(
                request.getId(),
                request.getCommunity().getId(),
                request.getUser().getId(),
                request.getUser().getUsername(),
                request.getStatus(),
                request.getCreatedAt()
        );
    }

    private InviteLinkResponse toInviteLinkResponse(CommunityInviteLink link) {
        return new InviteLinkResponse(
                link.getId(),
                link.getCommunity().getId(),
                link.getCode(),
                link.getCreatedBy().getId(),
                link.getCreatedBy().getUsername(),
                link.getExpiresAt(),
                link.getMaxUses(),
                link.getUseCount(),
                link.isActive(),
                link.getCreatedAt()
        );
    }

    private BanResponse toBanResponse(CommunityBan ban) {
        boolean expired = ban.getExpiresAt() != null && ban.getExpiresAt().isBefore(Instant.now());
        return new BanResponse(
                ban.getId(),
                ban.getCommunity().getId(),
                ban.getUser().getId(),
                ban.getUser().getUsername(),
                getUserAvatarUrl(ban.getUser().getId()),
                ban.getBannedBy().getId(),
                ban.getBannedBy().getUsername(),
                ban.getReason(),
                ban.getDuration(),
                ban.getExpiresAt(),
                !expired,
                ban.getCreatedAt()
        );
    }

    private ModLogResponse toModLogResponse(ModerationLog log) {
        return new ModLogResponse(
                log.getId(),
                log.getCommunity().getId(),
                log.getActor().getId(),
                log.getActor().getUsername(),
                log.getAction().name(),
                log.getTargetId(),
                log.getTargetType(),
                log.getDetails(),
                log.getCreatedAt()
        );
    }

    // --- Tags ---

    @Transactional(readOnly = true)
    public List<CommunityTagResponse> getTags(UUID communityId) {
        return communityTagRepository.findByCommunityId(communityId).stream()
                .map(this::toTagResponse)
                .toList();
    }

    @Transactional
    public CommunityTagResponse createTag(UUID communityId, CommunityTagRequest request, AuthPrincipal principal) {
        Community community = findCommunityById(communityId);
        CommunityMember actor = findMemberOrThrow(communityId, UUID.fromString(principal.userId()));

        if (actor.getRole() != CommunityRole.OWNER && actor.getRole() != CommunityRole.ADMIN && actor.getRole() != CommunityRole.MOD) {
            throw new IllegalArgumentException("Only the owner, admins, or moderators can create tags");
        }

        // Check max tags count
        if (communityTagRepository.countByCommunityId(communityId) >= 50) {
            throw new IllegalArgumentException("Maximum 50 tags per community reached");
        }

        // Validate name length
        String name = request.name().trim();
        if (name.length() < 2 || name.length() > 30) {
            throw new IllegalArgumentException("Tag length must be between 2 and 30 characters");
        }

        // Check if name has valid characters
        if (!name.matches("^[a-zA-Z0-9 -]+$")) {
            throw new IllegalArgumentException("Only letters, numbers, spaces, and hyphens allowed");
        }

        // Validate max 3 words
        if (name.split("\\s+").length > 3) {
            throw new IllegalArgumentException("Tag name must be at most 3 words");
        }

        // Check for duplicate tag (case-insensitive)
        if (communityTagRepository.findByCommunityIdAndNameIgnoreCase(communityId, name).isPresent()) {
            throw new IllegalArgumentException("A tag with this name already exists in this community");
        }

        String color = request.color();
        if (color == null || color.trim().isEmpty()) {
            color = "#3B82F6";
        } else {
            color = color.trim();
            if (!color.matches("^#[0-9a-fA-F]{6}$")) {
                throw new IllegalArgumentException("Invalid hex color code");
            }
        }

        CommunityTag tag = new CommunityTag();
        tag.setCommunityId(communityId);
        tag.setName(name);
        tag.setColor(color);
        communityTagRepository.save(tag);

        return toTagResponse(tag);
    }

    @Transactional
    public void deleteTag(UUID communityId, UUID tagId, AuthPrincipal principal) {
        Community community = findCommunityById(communityId);
        CommunityMember actor = findMemberOrThrow(communityId, UUID.fromString(principal.userId()));

        if (actor.getRole() != CommunityRole.OWNER && actor.getRole() != CommunityRole.ADMIN && actor.getRole() != CommunityRole.MOD) {
            throw new IllegalArgumentException("Only the owner, admins, or moderators can delete tags");
        }

        CommunityTag tag = communityTagRepository.findById(tagId)
                .orElseThrow(() -> new IllegalArgumentException("Tag not found"));

        if (!tag.getCommunityId().equals(communityId)) {
            throw new IllegalArgumentException("Tag does not belong to this community");
        }

        communityTagRepository.delete(tag);
    }

    private CommunityTagResponse toTagResponse(CommunityTag tag) {
        return new CommunityTagResponse(tag.getId(), tag.getCommunityId(), tag.getName(), tag.getColor());
    }
}
