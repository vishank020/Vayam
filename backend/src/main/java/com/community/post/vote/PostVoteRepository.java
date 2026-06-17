package com.community.post.vote;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PostVoteRepository extends JpaRepository<PostVote, UUID> {
    Optional<PostVote> findByPostIdAndUserId(UUID postId, UUID userId);
    long countByPostIdAndDirection(UUID postId, int direction);

    @Query("SELECT v.postId, COUNT(v) FROM PostVote v WHERE v.postId IN :postIds AND v.direction = :direction GROUP BY v.postId")
    List<Object[]> countByPostIdInAndDirection(@Param("postIds") List<UUID> postIds, @Param("direction") int direction);

    @Query("SELECT v FROM PostVote v WHERE v.postId IN :postIds AND v.userId = :userId")
    List<PostVote> findByPostIdInAndUserId(@Param("postIds") List<UUID> postIds, @Param("userId") UUID userId);
}
