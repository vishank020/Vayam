package com.community.comment.vote;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface CommentVoteRepository extends JpaRepository<CommentVote, UUID> {
    Optional<CommentVote> findByCommentIdAndUserId(UUID commentId, UUID userId);
    long countByCommentIdAndDirection(UUID commentId, int direction);
}
