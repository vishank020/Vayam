package com.community.post.vote;

import com.community.post.Post;
import com.community.post.PostRepository;
import com.community.post.dto.VoteRequest;
import com.community.notification.NotificationService;
import com.community.notification.NotificationType;
import com.community.user.User;
import com.community.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class PostVoteService {
    private final PostVoteRepository postVoteRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public PostVoteService(PostVoteRepository postVoteRepository,
                           PostRepository postRepository,
                           UserRepository userRepository,
                           NotificationService notificationService) {
        this.postVoteRepository = postVoteRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public void vote(UUID postId, UUID userId, VoteRequest request) {
        User voter = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!voter.isEmailVerified()) {
            throw new IllegalArgumentException("Email address is not verified. Please verify your email to perform this action.");
        }

        Optional<PostVote> existingOpt = postVoteRepository.findByPostIdAndUserId(postId, userId);
        
        if (request.direction() == 0) {
            existingOpt.ifPresent(postVoteRepository::delete);
            return;
        }

        PostVote vote = existingOpt.orElseGet(() -> {
            PostVote v = new PostVote();
            v.setPostId(postId);
            v.setUserId(userId);
            return v;
        });

        vote.setDirection(request.direction());
        postVoteRepository.save(vote);

        if (request.direction() == 1) {
            Post post = postRepository.findById(postId)
                    .orElseThrow(() -> new IllegalArgumentException("Post not found"));
            
            if (!post.getUserId().equals(userId)) {
                notificationService.createNotification(
                        post.getUserId(),
                        NotificationType.LIKE,
                        postId,
                        "post",
                        userId,
                        voter.getUsername() + " liked your post"
                );
            }
        }
    }
}
