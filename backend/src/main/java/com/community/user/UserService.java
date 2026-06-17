package com.community.user;

import com.community.auth.AuthPrincipal;
import com.community.follow.FollowService;
import com.community.post.PostRepository;
import com.community.comment.CommentRepository;
import com.community.user.dto.*;
import com.community.mute.MuteService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final FollowService followService;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final MuteService muteService;

    public UserService(UserRepository userRepository, UserProfileRepository userProfileRepository,
                       FollowService followService, PostRepository postRepository, CommentRepository commentRepository, MuteService muteService) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.followService = followService;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.muteService = muteService;
    }

    public UserResponse getProfile(AuthPrincipal principal) {
        User user = findUserById(principal.userId());
        return toResponse(user, principal);
    }

    public UserResponse getProfileById(UUID userId, AuthPrincipal principal) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return toResponse(user, principal);
    }



    public UserResponse updateProfile(AuthPrincipal principal, UpdateProfileRequest request) {
        User user = findUserById(principal.userId());
        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Profile not found for user: " + user.getId()));

        if (request.displayName() != null) {
            profile.setDisplayName(request.displayName());
        }
        if (request.bio() != null) {
            profile.setBio(request.bio());
        }
        if (request.avatarUrl() != null) {
            profile.setAvatarUrl(request.avatarUrl());
        }
        if (request.coverUrl() != null) {
            profile.setCoverUrl(request.coverUrl());
        }
        if (request.website() != null) {
            profile.setWebsite(request.website());
        }
        if (request.location() != null) {
            profile.setLocation(request.location());
        }

        userProfileRepository.save(profile);
        return toResponse(user, principal);
    }

    public UserResponse removeAvatar(AuthPrincipal principal) {
        User user = findUserById(principal.userId());
        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Profile not found for user: " + user.getId()));

        profile.setAvatarUrl(null);
        userProfileRepository.save(profile);
        return toResponse(user, principal);
    }

    public void updatePublicKey(AuthPrincipal principal, String publicKey) {
        User user = findUserById(principal.userId());
        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Profile not found for user: " + user.getId()));
        profile.setPublicKey(publicKey);
        userProfileRepository.save(profile);
    }

    public String getPublicKey(UUID userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found for user: " + userId));
        return profile.getPublicKey();
    }

    public UserResponse getProfileByUsername(String username, AuthPrincipal principal) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Profile not found for user: " + user.getId()));

        var counts = followService.getCounts(user.getId());
        Boolean isFollowing = null;
        Boolean isMuted = null;

        if (principal != null) {
            isFollowing = followService.isFollowing(UUID.fromString(principal.userId()), user.getId());
            isMuted = muteService.isMuted(UUID.fromString(principal.userId()), user.getId());
        }

        long postCount = postRepository.countByUserId(user.getId());
        long commentCount = commentRepository.countByUserId(user.getId());

        return new UserResponse(
                user.getId(),
                user.getUsername(),
                profile.getDisplayName(),
                profile.getBio(),
                profile.getAvatarUrl(),
                profile.getCoverUrl(),
                profile.getWebsite(),
                profile.getLocation(),
                profile.getPublicKey(),
                user.getRole(),
                user.getCreatedAt(),
                counts.followersCount(),
                counts.followingCount(),
                postCount,
                commentCount,
                isFollowing,
                user.isTotpEnabled(),
                false // You can't mute yourself
        );
    }

    private User findUserById(String userId) {
        return userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private UserResponse toResponse(User user, AuthPrincipal principal) {
        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Profile not found for user: " + user.getId()));

        UUID currentUserId = principal != null ? UUID.fromString(principal.userId()) : null;
        var counts = followService.getCounts(user.getId());
        long followerCount = counts.followersCount();
        long followingCount = counts.followingCount();
        boolean isFollowing = currentUserId != null && followService.isFollowing(currentUserId, user.getId());
        Boolean isMuted = currentUserId != null ? muteService.isMuted(currentUserId, user.getId()) : null;

        long postCount = postRepository.countByUserId(user.getId());
        long commentCount = commentRepository.countByUserId(user.getId());

        return new UserResponse(
                user.getId(),
                user.getUsername(),
                profile.getDisplayName(),
                profile.getBio(),
                profile.getAvatarUrl(),
                profile.getCoverUrl(),
                profile.getWebsite(),
                profile.getLocation(),
                profile.getPublicKey(),
                user.getRole(),
                user.getCreatedAt(),
                followerCount,
                followingCount,
                postCount,
                commentCount,
                isFollowing,
                user.isTotpEnabled(),
                isMuted
        );
    }

    public java.util.List<UserSummary> searchUsers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return userRepository.findByUsernameContainingIgnoreCase(query).stream()
                .limit(5)
                .map(u -> {
                    UserProfile profile = userProfileRepository.findByUserId(u.getId()).orElse(null);
                    return new UserSummary(
                            u.getId(),
                            u.getUsername(),
                            profile != null ? profile.getDisplayName() : null,
                            profile != null ? profile.getAvatarUrl() : null
                    );
                })
                .toList();
    }
}
