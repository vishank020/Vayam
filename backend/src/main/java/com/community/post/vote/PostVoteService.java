package com.community.post.vote;

import com.community.post.dto.VoteRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PostVoteService {
    private final PostVoteRepository postVoteRepository;

    @Transactional
    public void vote(UUID postId, UUID userId, VoteRequest request) {
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
    }
}
