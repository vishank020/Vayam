package com.community.post;

import com.community.auth.AuthPrincipal;
import java.time.Instant;
import com.community.block.BlockService;
import com.community.comment.CommentRepository;
import com.community.community.Community;
import com.community.community.CommunityBanRepository;
import com.community.community.CommunityMember;
import com.community.community.CommunityMemberRepository;
import com.community.community.CommunityRepository;
import com.community.community.CommunityRole;
import com.community.community.CommunityTag;
import com.community.community.CommunityTagRepository;
import com.community.community.CommunityVisibility;
import com.community.mute.MuteService;
import com.community.post.dto.CreatePostRequest;
import com.community.post.dto.FeedPostResponse;
import com.community.post.dto.PostResponse;
import com.community.post.vote.PostVoteRepository;
import com.community.post.vote.PostVote;
import com.community.post.save.PostSave;
import com.community.user.User;
import com.community.user.UserProfile;
import com.community.user.UserProfileRepository;
import com.community.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostAnonymousMapRepository anonymousMapRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final CommunityRepository communityRepository;
    private final BlockService blockService;
    private final MuteService muteService;
    private final CommentRepository commentRepository;
    private final PostVoteRepository postVoteRepository;
    private final com.community.post.save.PostSaveRepository postSaveRepository;
    private final CommunityMemberRepository communityMemberRepository;
    private final CommunityBanRepository communityBanRepository;
    private final JdbcTemplate jdbcTemplate;
    private final CommunityTagRepository communityTagRepository;

    @Transactional
    public PostResponse createPost(AuthPrincipal principal, CreatePostRequest request) {
        if (principal == null) {
            throw new IllegalArgumentException("Authentication required to create posts");
        }

        User author = userRepository.findById(UUID.fromString(principal.userId()))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!author.isEmailVerified()) {
            throw new IllegalArgumentException("Email address is not verified. Please verify your email to perform this action.");
        }

        if (request.communityId() != null) {
            Community community = communityRepository.findById(request.communityId())
                    .orElseThrow(() -> new IllegalArgumentException("Community not found"));

            UUID authorId = author.getId();

            if (communityBanRepository.existsByCommunityIdAndUserId(community.getId(), authorId)) {
                throw new IllegalArgumentException("You are banned from posting in this community");
            }

            var membership = communityMemberRepository.findByCommunityIdAndUserId(community.getId(), authorId);
            if (membership.isEmpty()) {
                throw new IllegalArgumentException("You must be a member to post in this community");
            }

            CommunityRole role = membership.get().getRole();
            if (community.getVisibility() == CommunityVisibility.RESTRICTED) {
                if (role != CommunityRole.OWNER && role != CommunityRole.ADMIN && role != CommunityRole.MOD) {
                    throw new IllegalArgumentException("Only owners, admins, or moderators can post in this restricted community");
                }
            }
        }

        Post post = new Post();
        post.setTitle(request.title());
        post.setContent(request.content());
        post.setPostType(request.postType() != null ? request.postType() : PostType.GENERAL);
        post.setUserId(author.getId());
        post.setCommunityId(request.communityId());
        post.setAnonymous(request.isAnonymous());

        if (request.mediaUrls() != null) {
            post.setMediaUrls(request.mediaUrls().toArray(new String[0]));
        } else {
            post.setMediaUrls(new String[]{});
        }

        if (request.saveAsDraft()) {
            post.setStatus(PostStatus.DRAFT);
        } else if (request.scheduledAt() != null && !request.scheduledAt().isEmpty()) {
            post.setScheduledAt(Instant.parse(request.scheduledAt()));
            post.setStatus(PostStatus.SCHEDULED);
        }

        if (request.tagId() != null) {
            if (post.getCommunityId() == null) {
                throw new IllegalArgumentException("Tags can only be associated with community posts");
            }
            CommunityTag tag = communityTagRepository.findById(request.tagId())
                    .orElseThrow(() -> new IllegalArgumentException("Tag not found"));
            if (!tag.getCommunityId().equals(post.getCommunityId())) {
                throw new IllegalArgumentException("Tag does not belong to the selected community");
            }
            post.setTag(tag);
        }

        postRepository.save(post);

        if (request.isAnonymous()) {
            PostAnonymousMap map = new PostAnonymousMap();
            map.setPostId(post.getId());
            map.setUserId(author.getId());
            anonymousMapRepository.save(map);
        }

        return toPostResponse(post, true, principal);
    }

    @Transactional(readOnly = true)
    public Page<FeedPostResponse> getFeed(PostType type, Pageable pageable, AuthPrincipal principal) {
        Page<Post> postPage;
        UUID userId = null;
        if (principal == null) {
            postPage = postRepository.findGlobalFeed(type, pageable);
        } else {
            userId = UUID.fromString(principal.userId());
            List<UUID> excludedIds = new java.util.ArrayList<>(blockService.getBlockedUserIds(userId));
            excludedIds.addAll(muteService.getMutedUserIds(principal.userId()));

            if (excludedIds.isEmpty()) {
                postPage = postRepository.findPersonalizedFeed(userId, type, pageable);
            } else {
                postPage = postRepository.findPersonalizedFeedExcluding(userId, excludedIds, type, pageable);
            }
        }

        List<Post> posts = postPage.getContent();
        if (posts.isEmpty()) {
            return postPage.map(p -> toFeedPostResponse(p, principal));
        }

        List<UUID> postIds = posts.stream().map(Post::getId).collect(Collectors.toList());
        List<UUID> authorIds = posts.stream().map(Post::getUserId).distinct().collect(Collectors.toList());

        Map<UUID, UserProfile> profilesByUserId = userProfileRepository.findByUserIdInWithUser(authorIds).stream()
                .collect(Collectors.toMap(up -> up.getUser().getId(), Function.identity()));

        List<UUID> commIds = posts.stream()
                .map(Post::getCommunityId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        Map<UUID, Community> communitiesById = commIds.isEmpty() ? Collections.emptyMap() :
                communityRepository.findAllById(commIds).stream()
                        .collect(Collectors.toMap(Community::getId, Function.identity()));

        Map<UUID, Long> commentCounts = commentRepository.countByPostIdIn(postIds).stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> (Long) row[1]));

        Map<UUID, Long> upvoteCounts = postVoteRepository.countByPostIdInAndDirection(postIds, 1).stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> (Long) row[1]));
        Map<UUID, Long> downvoteCounts = postVoteRepository.countByPostIdInAndDirection(postIds, -1).stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> (Long) row[1]));

        Map<UUID, Integer> userVotes = Collections.emptyMap();
        Set<UUID> savedPostIds = Collections.emptySet();
        if (principal != null) {
            userVotes = postVoteRepository.findByPostIdInAndUserId(postIds, userId).stream()
                    .collect(Collectors.toMap(PostVote::getPostId, PostVote::getDirection));
            savedPostIds = postSaveRepository.findByPostIdInAndUserId(postIds, userId).stream()
                    .map(PostSave::getPostId)
                    .collect(Collectors.toSet());
        }

        Map<UUID, Integer> finalUserVotes = userVotes;
        Set<UUID> finalSavedPostIds = savedPostIds;

        return postPage.map(p -> toFeedPostResponse(p, principal, profilesByUserId, communitiesById,
                commentCounts, upvoteCounts, downvoteCounts, finalUserVotes, finalSavedPostIds));
    }

    @Transactional(readOnly = true)
    public Page<FeedPostResponse> getCommunityFeed(UUID communityId, PostType type, UUID tagId, Pageable pageable, AuthPrincipal principal) {
        List<UUID> excludedIds = new java.util.ArrayList<>(communityBanRepository.findBannedUserIdsByCommunityId(communityId));
        if (principal != null) {
            excludedIds.addAll(blockService.getBlockedUserIds(UUID.fromString(principal.userId())));
            excludedIds.addAll(muteService.getMutedUserIds(principal.userId()));
        }

        if (excludedIds.isEmpty()) {
            return postRepository.findByCommunityIdOrderByCreatedAtDesc(communityId, type, tagId, pageable)
                    .map(p -> toFeedPostResponse(p, principal));
        }

        return postRepository.findByCommunityIdExcluding(communityId, excludedIds, type, tagId, pageable)
                .map(p -> toFeedPostResponse(p, principal));
    }

    @Transactional(readOnly = true)
    public Page<FeedPostResponse> getUserPosts(UUID userId, PostType type, Pageable pageable, AuthPrincipal principal) {
        return postRepository.findByUserIdOrderByCreatedAtDesc(userId, type, pageable)
                .map(p -> toFeedPostResponse(p, principal));
    }

    @Transactional(readOnly = true)
    public Page<FeedPostResponse> getUserSavedPosts(UUID userId, Pageable pageable, AuthPrincipal principal) {
        return postRepository.findSavedPostsByUserId(userId, pageable)
                .map(p -> toFeedPostResponse(p, principal));
    }

    @Transactional(readOnly = true)
    public Page<FeedPostResponse> getUserUpvotedPosts(UUID userId, Pageable pageable, AuthPrincipal principal) {
        return postRepository.findUpvotedPostsByUserId(userId, pageable)
                .map(p -> toFeedPostResponse(p, principal));
    }

    @Transactional(readOnly = true)
    public Page<FeedPostResponse> getUserDrafts(AuthPrincipal principal, Pageable pageable) {
        if (principal == null) {
            throw new IllegalArgumentException("Authentication required");
        }
        UUID userId = UUID.fromString(principal.userId());
        return postRepository.findDraftsByUserId(userId, pageable)
                .map(p -> toFeedPostResponse(p, principal));
    }

    @Transactional
    public void savePost(UUID postId, AuthPrincipal principal) {
        if (principal == null) throw new IllegalArgumentException("Must be logged in to save posts");
        UUID userId = UUID.fromString(principal.userId());
        if (!postSaveRepository.existsByPostIdAndUserId(postId, userId)) {
            com.community.post.save.PostSave save = new com.community.post.save.PostSave();
            save.setPostId(postId);
            save.setUserId(userId);
            postSaveRepository.save(save);
        }
    }

    @Transactional
    public void unsavePost(UUID postId, AuthPrincipal principal) {
        if (principal == null) throw new IllegalArgumentException("Must be logged in to unsave posts");
        UUID userId = UUID.fromString(principal.userId());
        postSaveRepository.findByPostIdAndUserId(postId, userId)
                .ifPresent(postSaveRepository::delete);
    }

    @Transactional(readOnly = true)
    public PostResponse getPost(UUID postId, AuthPrincipal principal) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        boolean isAuthor = principal != null && principal.userId().equals(post.getUserId().toString());

        if (post.getStatus() == PostStatus.DRAFT && !isAuthor) {
            throw new IllegalArgumentException("Post not found");
        }

        return toPostResponse(post, isAuthor, principal);
    }

    @Transactional
    public PostResponse updatePost(UUID postId, AuthPrincipal principal, CreatePostRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (principal == null || !principal.userId().equals(post.getUserId().toString())) {
            throw new IllegalArgumentException("Only the author can update this post");
        }
        User author = userRepository.findById(UUID.fromString(principal.userId()))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!author.isEmailVerified()) {
            throw new IllegalArgumentException("Email address is not verified. Please verify your email to perform this action.");
        }

        UUID userId = UUID.fromString(principal.userId());
        post.setTitle(request.title());
        post.setContent(request.content());
        if (request.postType() != null) {
            post.setPostType(request.postType());
        }

        if (request.tagId() != null) {
            if (post.getCommunityId() == null) {
                throw new IllegalArgumentException("Tags can only be associated with community posts");
            }
            CommunityTag tag = communityTagRepository.findById(request.tagId())
                    .orElseThrow(() -> new IllegalArgumentException("Tag not found"));
            if (!tag.getCommunityId().equals(post.getCommunityId())) {
                throw new IllegalArgumentException("Tag does not belong to the selected community");
            }
            post.setTag(tag);
        } else {
            post.setTag(null);
        }

        if (request.saveAsDraft()) {
            post.setStatus(PostStatus.DRAFT);
        } else if (post.getStatus() == PostStatus.DRAFT) {
            post.setStatus(PostStatus.PUBLISHED);
        }

        boolean wasAnonymous = post.isAnonymous();
        boolean nowAnonymous = request.isAnonymous();
        post.setAnonymous(nowAnonymous);

        if (wasAnonymous && !nowAnonymous) {
            anonymousMapRepository.findByPostId(postId).ifPresent(anonymousMapRepository::delete);
        } else if (!wasAnonymous && nowAnonymous) {
            if (anonymousMapRepository.findByPostId(postId).isEmpty()) {
                PostAnonymousMap map = new PostAnonymousMap();
                map.setPostId(postId);
                map.setUserId(userId);
                anonymousMapRepository.save(map);
            }
        }

        post.setUpdatedAt(Instant.now());
        postRepository.save(post);
        return toPostResponse(post, true, principal);
    }

    @Transactional
    public void pinPost(UUID postId, AuthPrincipal principal) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (post.getCommunityId() == null) {
            throw new IllegalArgumentException("Only community posts can be pinned");
        }

        if (principal == null) {
            throw new IllegalArgumentException("Authentication required");
        }

        CommunityMember member = communityMemberRepository.findByCommunityIdAndUserId(post.getCommunityId(), UUID.fromString(principal.userId()))
                .orElseThrow(() -> new IllegalArgumentException("You are not a member of this community"));

        if (member.getRole() != com.community.community.CommunityRole.OWNER
                && member.getRole() != com.community.community.CommunityRole.ADMIN
                && member.getRole() != com.community.community.CommunityRole.MOD) {
            throw new IllegalArgumentException("Only moderators can pin posts");
        }

        post.setPinned(true);
        post.setPinnedAt(Instant.now());
        postRepository.save(post);
    }

    @Transactional
    public void unpinPost(UUID postId, AuthPrincipal principal) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (post.getCommunityId() == null) {
            throw new IllegalArgumentException("Only community posts can be unpinned");
        }

        if (principal == null) {
            throw new IllegalArgumentException("Authentication required");
        }

        CommunityMember member = communityMemberRepository.findByCommunityIdAndUserId(post.getCommunityId(), UUID.fromString(principal.userId()))
                .orElseThrow(() -> new IllegalArgumentException("You are not a member of this community"));

        if (member.getRole() != com.community.community.CommunityRole.OWNER
                && member.getRole() != com.community.community.CommunityRole.ADMIN
                && member.getRole() != com.community.community.CommunityRole.MOD) {
            throw new IllegalArgumentException("Only moderators can unpin posts");
        }

        post.setPinned(false);
        post.setPinnedAt(null);
        postRepository.save(post);
    }

    @Transactional
    public void reportPost(UUID postId, AuthPrincipal principal, String reason) {
        if (principal == null) throw new IllegalArgumentException("Authentication required");
        UUID reporterId = UUID.fromString(principal.userId());

        postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        jdbcTemplate.update(
            "INSERT INTO reports (id, reporter_id, reported_post_id, reason, created_at) VALUES (?, ?, ?, ?, NOW())",
            UUID.randomUUID(), reporterId, postId, reason
        );
    }

    @Transactional
    public void deletePost(UUID postId, AuthPrincipal principal) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (principal == null || !principal.userId().equals(post.getUserId().toString())) {
            throw new IllegalArgumentException("Only the author can delete this post");
        }
        User author = userRepository.findById(UUID.fromString(principal.userId()))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!author.isEmailVerified()) {
            throw new IllegalArgumentException("Email address is not verified. Please verify your email to perform this action.");
        }

        postRepository.delete(post);
    }

    private PostResponse toPostResponse(Post post, boolean isAuthor, AuthPrincipal principal) {
        UserProfile profile = userProfileRepository.findByUserId(post.getUserId())
                .orElse(null);

        String communityName = null;
        String communitySlug = null;
        if (post.getCommunityId() != null) {
            var communityOpt = communityRepository.findById(post.getCommunityId());
            communityName = communityOpt.map(Community::getName).orElse(null);
            communitySlug = communityOpt.map(Community::getSlug).orElse(null);
        }

        long upvoteCount = postVoteRepository.countByPostIdAndDirection(post.getId(), 1);
        long downvoteCount = postVoteRepository.countByPostIdAndDirection(post.getId(), -1);
        Integer userVote = 0;
        boolean isSaved = false;
        if (principal != null) {
            userVote = postVoteRepository.findByPostIdAndUserId(post.getId(), UUID.fromString(principal.userId()))
                    .map(PostVote::getDirection)
                    .orElse(0);
            isSaved = postSaveRepository.existsByPostIdAndUserId(post.getId(), UUID.fromString(principal.userId()));
        }

        List<String> mediaList = toMediaList(post);

        String statusName = post.getStatus() != null ? post.getStatus().name() : null;

        UUID tagId = null;
        String tagName = null;
        String tagColor = null;
        if (post.getTag() != null) {
            tagId = post.getTag().getId();
            tagName = post.getTag().getName();
            tagColor = post.getTag().getColor();
        }

        if (post.isAnonymous() && !isAuthor) {
            return new PostResponse(
                    post.getId(),
                    post.getTitle(),
                    post.getContent(),
                    post.getPostType(),
                    null,
                    null,
                    null,
                    null,
                    true,
                    post.getCommunityId(),
                    communityName,
                    communitySlug,
                    post.getCreatedAt(),
                    post.getUpdatedAt(),
                    upvoteCount,
                    downvoteCount,
                    userVote,
                    mediaList,
                    isSaved,
                    post.isPinned(),
                    statusName,
                    tagId,
                    tagName,
                    tagColor
            );
        }

        String username = (profile != null && profile.getUser() != null) ? profile.getUser().getUsername() : null;
        return new PostResponse(
                post.getId(),
                post.getTitle(),
                post.getContent(),
                post.getPostType(),
                post.getUserId(),
                username,
                profile != null ? profile.getDisplayName() : null,
                profile != null ? profile.getAvatarUrl() : null,
                post.isAnonymous(),
                post.getCommunityId(),
                communityName,
                communitySlug,
                post.getCreatedAt(),
                post.getUpdatedAt(),
                upvoteCount,
                downvoteCount,
                userVote,
                mediaList,
                isSaved,
                post.isPinned(),
                statusName,
                tagId,
                tagName,
                tagColor
        );
    }

    private FeedPostResponse toFeedPostResponse(Post post, AuthPrincipal principal) {
        UserProfile profile = userProfileRepository.findByUserId(post.getUserId())
                .orElse(null);

        String communityName = null;
        String communitySlug = null;
        if (post.getCommunityId() != null) {
            var communityOpt = communityRepository.findById(post.getCommunityId());
            communityName = communityOpt.map(Community::getName).orElse(null);
            communitySlug = communityOpt.map(Community::getSlug).orElse(null);
        }

        long commentCount = commentRepository.countByPostId(post.getId());
        long upvoteCount = postVoteRepository.countByPostIdAndDirection(post.getId(), 1);
        long downvoteCount = postVoteRepository.countByPostIdAndDirection(post.getId(), -1);
        Integer userVote = 0;
        boolean isSaved = false;
        if (principal != null) {
            userVote = postVoteRepository.findByPostIdAndUserId(post.getId(), UUID.fromString(principal.userId()))
                    .map(PostVote::getDirection)
                    .orElse(0);
            isSaved = postSaveRepository.existsByPostIdAndUserId(post.getId(), UUID.fromString(principal.userId()));
        }

        String statusName = post.getStatus() != null ? post.getStatus().name() : null;
        List<String> mediaList = toMediaList(post);

        UUID tagId = null;
        String tagName = null;
        String tagColor = null;
        if (post.getTag() != null) {
            tagId = post.getTag().getId();
            tagName = post.getTag().getName();
            tagColor = post.getTag().getColor();
        }

        if (post.isAnonymous()) {
            return new FeedPostResponse(
                    post.getId(),
                    post.getTitle(),
                    post.getContent(),
                    post.getPostType(),
                    null,
                    null,
                    null,
                    null,
                    true,
                    post.getCommunityId(),
                    communityName,
                    communitySlug,
                    post.getCreatedAt(),
                    post.getUpdatedAt(),
                    commentCount,
                    upvoteCount,
                    downvoteCount,
                    userVote,
                    mediaList,
                    isSaved,
                    post.isPinned(),
                    statusName,
                    tagId,
                    tagName,
                    tagColor
            );
        }

        String username = (profile != null && profile.getUser() != null) ? profile.getUser().getUsername() : null;
        return new FeedPostResponse(
                post.getId(),
                post.getTitle(),
                post.getContent(),
                post.getPostType(),
                post.getUserId(),
                username,
                profile != null ? profile.getDisplayName() : null,
                profile != null ? profile.getAvatarUrl() : null,
                false,
                post.getCommunityId(),
                communityName,
                communitySlug,
                post.getCreatedAt(),
                post.getUpdatedAt(),
                commentCount,
                upvoteCount,
                downvoteCount,
                userVote,
                mediaList,
                isSaved,
                post.isPinned(),
                statusName,
                tagId,
                tagName,
                tagColor
        );
    }

    private FeedPostResponse toFeedPostResponse(
            Post post, AuthPrincipal principal,
            Map<UUID, UserProfile> profilesByUserId,
            Map<UUID, Community> communitiesById,
            Map<UUID, Long> commentCountsByPostId,
            Map<UUID, Long> upvoteCountsByPostId,
            Map<UUID, Long> downvoteCountsByPostId,
            Map<UUID, Integer> userVotesByPostId,
            Set<UUID> savedPostIds
    ) {
        UserProfile profile = profilesByUserId.get(post.getUserId());

        String communityName = null;
        String communitySlug = null;
        if (post.getCommunityId() != null) {
            Community community = communitiesById.get(post.getCommunityId());
            if (community != null) {
                communityName = community.getName();
                communitySlug = community.getSlug();
            }
        }

        long commentCount = commentCountsByPostId.getOrDefault(post.getId(), 0L);
        long upvoteCount = upvoteCountsByPostId.getOrDefault(post.getId(), 0L);
        long downvoteCount = downvoteCountsByPostId.getOrDefault(post.getId(), 0L);
        Integer userVote = 0;
        boolean isSaved = false;
        if (principal != null) {
            userVote = userVotesByPostId.getOrDefault(post.getId(), 0);
            isSaved = savedPostIds.contains(post.getId());
        }

        String statusName = post.getStatus() != null ? post.getStatus().name() : null;
        List<String> mediaList = toMediaList(post);

        UUID tagId = null;
        String tagName = null;
        String tagColor = null;
        if (post.getTag() != null) {
            tagId = post.getTag().getId();
            tagName = post.getTag().getName();
            tagColor = post.getTag().getColor();
        }

        if (post.isAnonymous()) {
            return new FeedPostResponse(
                    post.getId(),
                    post.getTitle(),
                    post.getContent(),
                    post.getPostType(),
                    null,
                    null,
                    null,
                    null,
                    true,
                    post.getCommunityId(),
                    communityName,
                    communitySlug,
                    post.getCreatedAt(),
                    post.getUpdatedAt(),
                    commentCount,
                    upvoteCount,
                    downvoteCount,
                    userVote,
                    mediaList,
                    isSaved,
                    post.isPinned(),
                    statusName,
                    tagId,
                    tagName,
                    tagColor
            );
        }

        String username = (profile != null && profile.getUser() != null) ? profile.getUser().getUsername() : null;
        return new FeedPostResponse(
                post.getId(),
                post.getTitle(),
                post.getContent(),
                post.getPostType(),
                post.getUserId(),
                username,
                profile != null ? profile.getDisplayName() : null,
                profile != null ? profile.getAvatarUrl() : null,
                false,
                post.getCommunityId(),
                communityName,
                communitySlug,
                post.getCreatedAt(),
                post.getUpdatedAt(),
                commentCount,
                upvoteCount,
                downvoteCount,
                userVote,
                mediaList,
                isSaved,
                post.isPinned(),
                statusName,
                tagId,
                tagName,
                tagColor
        );
    }

    private static List<String> toMediaList(Post post) {
        String[] urls = post.getMediaUrls();
        return urls != null ? Arrays.asList(urls) : List.of();
    }
}
