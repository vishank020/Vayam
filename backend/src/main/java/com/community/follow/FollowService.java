package com.community.follow;

import com.community.auth.AuthPrincipal;
import com.community.block.BlockService;
import com.community.follow.dto.FollowCountResponse;
import com.community.follow.dto.FollowResponse;
import com.community.notification.NotificationService;
import com.community.notification.NotificationType;
import com.community.user.User;
import com.community.user.UserProfile;
import com.community.user.UserProfileRepository;
import com.community.user.UserRepository;
import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final NotificationService notificationService;
    private final BlockService blockService;

    public FollowService(FollowRepository followRepository, UserRepository userRepository,
                         UserProfileRepository userProfileRepository,
                         NotificationService notificationService, BlockService blockService) {
        this.followRepository = followRepository;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.notificationService = notificationService;
        this.blockService = blockService;
    }

    @Transactional
    public void follow(AuthPrincipal principal, UUID targetUserId) {
        if (principal == null) {
            throw new IllegalArgumentException("Authentication required to follow users");
        }

        UUID currentUserId = UUID.fromString(principal.userId());

        if (blockService.isBlocked(targetUserId, currentUserId)) {
            throw new IllegalArgumentException("Cannot follow this user");
        }

        if (currentUserId.equals(targetUserId)) {
            throw new IllegalArgumentException("Cannot follow yourself");
        }

        userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (followRepository.existsByFollowerIdAndFollowedId(currentUserId, targetUserId)) {
            throw new IllegalArgumentException("Already following this user");
        }

        Follow follow = new Follow();
        follow.setFollowerId(currentUserId);
        follow.setFollowedId(targetUserId);
        followRepository.save(follow);

        notificationService.createNotification(
                targetUserId,
                NotificationType.FOLLOW,
                currentUserId,
                "user",
                currentUserId,
                principal.username() + " started following you"
        );
    }

    @Transactional
    public void unfollow(AuthPrincipal principal, UUID targetUserId) {
        if (principal == null) {
            throw new IllegalArgumentException("Authentication required to unfollow users");
        }

        UUID currentUserId = UUID.fromString(principal.userId());

        Follow follow = followRepository.findByFollowerIdAndFollowedId(currentUserId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Not following this user"));

        followRepository.delete(follow);
    }

    @Transactional(readOnly = true)
    public Page<FollowResponse> getFollowers(UUID userId, Pageable pageable) {
        return followRepository.findByFollowedIdOrderByCreatedAtDesc(userId, pageable)
                .map(f -> toResponse(f.getFollowerId(), f.getCreatedAt()));
    }

    @Transactional(readOnly = true)
    public Page<FollowResponse> getFollowing(UUID userId, Pageable pageable) {
        return followRepository.findByFollowerIdOrderByCreatedAtDesc(userId, pageable)
                .map(f -> toResponse(f.getFollowedId(), f.getCreatedAt()));
    }

    @Transactional(readOnly = true)
    public FollowCountResponse getCounts(UUID userId) {
        long followersCount = followRepository.countByFollowedId(userId);
        long followingCount = followRepository.countByFollowerId(userId);
        return new FollowCountResponse(followersCount, followingCount);
    }

    @Transactional(readOnly = true)
    public boolean isFollowing(UUID currentUserId, UUID targetUserId) {
        return followRepository.existsByFollowerIdAndFollowedId(currentUserId, targetUserId);
    }

    private FollowResponse toResponse(UUID targetUserId, Instant createdAt) {
        UserProfile profile = userProfileRepository.findByUserId(targetUserId)
                .orElse(null);

        String username = (profile != null && profile.getUser() != null) ? profile.getUser().getUsername() : null;

        return new FollowResponse(
                null,
                targetUserId,
                username,
                profile != null ? profile.getDisplayName() : null,
                profile != null ? profile.getAvatarUrl() : null,
                createdAt
        );
    }
}
