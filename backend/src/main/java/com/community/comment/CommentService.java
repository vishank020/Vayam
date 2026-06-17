package com.community.comment;

import com.community.auth.AuthPrincipal;
import com.community.comment.dto.CommentResponse;
import com.community.comment.dto.CreateCommentRequest;
import com.community.comment.vote.CommentVote;
import com.community.comment.vote.CommentVoteRepository;
import com.community.notification.NotificationService;
import com.community.notification.NotificationType;
import com.community.post.Post;
import com.community.post.PostRepository;
import com.community.user.User;
import com.community.user.UserProfile;
import com.community.user.UserProfileRepository;
import com.community.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final NotificationService notificationService;
    private final CommentVoteRepository commentVoteRepository;

    @Transactional
    public CommentResponse createComment(AuthPrincipal principal, UUID postId, CreateCommentRequest request) {
        if (principal == null) {
            throw new IllegalArgumentException("Authentication required to comment");
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        User author = userRepository.findById(UUID.fromString(principal.userId()))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Comment comment = new Comment();
        comment.setPostId(postId);
        comment.setUserId(author.getId());
        comment.setContent(request.content());
        comment.setAnonymous(post.isAnonymous() && !post.getUserId().equals(author.getId()));

        if (request.parentId() != null) {
            Comment parent = commentRepository.findById(request.parentId())
                    .orElseThrow(() -> new IllegalArgumentException("Parent comment not found"));
            if (!parent.getPostId().equals(postId)) {
                throw new IllegalArgumentException("Parent comment does not belong to this post");
            }
            comment.setParentId(request.parentId());
        }

        commentRepository.save(comment);

        if (!post.getUserId().equals(author.getId())) {
            notificationService.createNotification(
                    post.getUserId(),
                    NotificationType.COMMENT,
                    postId,
                    "post",
                    author.getId(),
                    author.getUsername() + " commented on your post"
            );
        }

        if (request.parentId() != null) {
            Comment parent = commentRepository.findById(request.parentId()).orElse(null);
            if (parent != null && !parent.getUserId().equals(author.getId())
                    && !parent.getUserId().equals(post.getUserId())) {
                notificationService.createNotification(
                        parent.getUserId(),
                        NotificationType.COMMENT,
                        comment.getId(),
                        "comment",
                        author.getId(),
                        author.getUsername() + " replied to your comment"
                );
            }
        }

        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("@([a-zA-Z0-9_]+)");
        java.util.regex.Matcher matcher = pattern.matcher(request.content());
        while (matcher.find()) {
            String mentionedUsername = matcher.group(1);
            try {
                userRepository.findByUsername(mentionedUsername).ifPresent(mentionedUser -> {
                    if (!mentionedUser.getId().equals(author.getId())) {
                        notificationService.createNotification(
                                mentionedUser.getId(),
                                NotificationType.MENTION,
                                comment.getId(),
                                "comment",
                                author.getId(),
                                author.getUsername() + " mentioned you in a comment"
                        );
                    }
                });
            } catch (Exception e) {
                // ignore
            }
        }

        return toResponse(comment, true, principal);
    }

    @Transactional(readOnly = true)
    public java.util.List<CommentResponse> getComments(UUID postId, AuthPrincipal principal) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        java.util.List<Comment> rootComments = commentRepository.findByPostIdAndParentIdIsNullOrderByCreatedAtAsc(postId);

        return rootComments.stream().map(root -> {
            java.util.List<Comment> replies = commentRepository.findByParentIdOrderByCreatedAtAsc(root.getId());
            java.util.List<CommentResponse> replyResponses = replies.stream().map(reply -> {
                boolean isAuthor = principal != null && principal.userId().equals(reply.getUserId().toString());
                boolean isPostAuthor = principal != null && principal.userId().equals(post.getUserId().toString());
                return toResponse(reply, isAuthor || isPostAuthor, principal, java.util.Collections.emptyList());
            }).toList();

            boolean isAuthor = principal != null && principal.userId().equals(root.getUserId().toString());
            boolean isPostAuthor = principal != null && principal.userId().equals(post.getUserId().toString());
            return toResponse(root, isAuthor || isPostAuthor, principal, replyResponses);
        }).toList();
    }

    @Transactional(readOnly = true)
    public Page<CommentResponse> getUserComments(UUID userId, Pageable pageable, AuthPrincipal principal) {
        Page<Comment> comments = commentRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return comments.map(comment -> {
            boolean isAuthor = principal != null && principal.userId().equals(comment.getUserId().toString());
            // For user comments view, we don't fetch replies eagerly
            return toResponse(comment, isAuthor, principal, java.util.Collections.emptyList());
        });
    }

    @Transactional
    public void deleteComment(UUID commentId, AuthPrincipal principal) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (principal == null || !principal.userId().equals(comment.getUserId().toString())) {
            throw new IllegalArgumentException("Only the author can delete this comment");
        }

        commentRepository.delete(comment);
    }

    @Transactional
    public CommentResponse editComment(UUID commentId, String content, AuthPrincipal principal) {
        if (principal == null) {
            throw new IllegalArgumentException("Authentication required to edit comment");
        }

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!principal.userId().equals(comment.getUserId().toString())) {
            throw new IllegalArgumentException("Only the author can edit this comment");
        }

        comment.setContent(content);
        comment.setUpdatedAt(java.time.Instant.now());
        commentRepository.save(comment);

        return toResponse(comment, true, principal);
    }

    private CommentResponse toResponse(Comment comment, boolean canRevealAuthor, AuthPrincipal principal) {
        return toResponse(comment, canRevealAuthor, principal, java.util.Collections.emptyList());
    }

    private CommentResponse toResponse(Comment comment, boolean canRevealAuthor, AuthPrincipal principal, java.util.List<CommentResponse> replies) {
        UserProfile profile = userProfileRepository.findByUserId(comment.getUserId())
                .orElse(null);

        String username = (profile != null && profile.getUser() != null) ? profile.getUser().getUsername() : null;

        long upvoteCount = commentVoteRepository.countByCommentIdAndDirection(comment.getId(), 1);
        long downvoteCount = commentVoteRepository.countByCommentIdAndDirection(comment.getId(), -1);
        Integer userVote = 0;
        if (principal != null) {
            userVote = commentVoteRepository.findByCommentIdAndUserId(comment.getId(), UUID.fromString(principal.userId()))
                    .map(CommentVote::getDirection)
                    .orElse(0);
        }

        if (comment.isAnonymous() && !canRevealAuthor) {
            return new CommentResponse(
                    comment.getId(),
                    comment.getPostId(),
                    comment.getParentId(),
                    null,
                    null,
                    null,
                    null,
                    comment.getContent(),
                    true,
                    canRevealAuthor,
                    comment.getCreatedAt(),
                    comment.getUpdatedAt(),
                    upvoteCount,
                    downvoteCount,
                    userVote,
                    replies
            );
        }

        return new CommentResponse(
                comment.getId(),
                comment.getPostId(),
                comment.getParentId(),
                comment.getUserId(),
                username,
                profile != null ? profile.getDisplayName() : null,
                profile != null ? profile.getAvatarUrl() : null,
                comment.getContent(),
                comment.isAnonymous(),
                canRevealAuthor,
                comment.getCreatedAt(),
                comment.getUpdatedAt(),
                upvoteCount,
                downvoteCount,
                userVote,
                replies
        );
    }
}
