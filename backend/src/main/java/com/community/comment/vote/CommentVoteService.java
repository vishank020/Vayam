package com.community.comment.vote;

import com.community.post.dto.VoteRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommentVoteService {
    private final CommentVoteRepository commentVoteRepository;

    @Transactional
    public void vote(UUID commentId, UUID userId, VoteRequest request) {
        Optional<CommentVote> existingOpt = commentVoteRepository.findByCommentIdAndUserId(commentId, userId);
        
        if (request.direction() == 0) {
            existingOpt.ifPresent(commentVoteRepository::delete);
            return;
        }

        CommentVote vote = existingOpt.orElseGet(() -> {
            CommentVote v = new CommentVote();
            v.setCommentId(commentId);
            v.setUserId(userId);
            return v;
        });

        vote.setDirection(request.direction());
        commentVoteRepository.save(vote);
    }
}
