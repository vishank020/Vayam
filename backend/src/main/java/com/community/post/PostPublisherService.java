package com.community.post;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class PostPublisherService {

    private final PostRepository postRepository;

    public PostPublisherService(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    @Transactional
    @Scheduled(fixedRate = 60000)
    public void publishScheduledPosts() {
        Instant now = Instant.now();
        var duePosts = postRepository.findScheduledPostsDueForPublishing(now);
        for (Post post : duePosts) {
            post.setStatus(PostStatus.PUBLISHED);
            post.setCreatedAt(now);
            postRepository.save(post);
        }
    }
}
