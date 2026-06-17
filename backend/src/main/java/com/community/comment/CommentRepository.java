package com.community.comment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {

    Page<Comment> findByPostIdOrderByCreatedAtAsc(UUID postId, Pageable pageable);

    Page<Comment> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    long countByUserId(UUID userId);

    long countByPostId(UUID postId);

    @Query("SELECT c.postId, COUNT(c) FROM Comment c WHERE c.postId IN :postIds GROUP BY c.postId")
    List<Object[]> countByPostIdIn(@Param("postIds") List<UUID> postIds);

    void deleteByPostId(UUID postId);

    java.util.List<Comment> findByPostIdAndParentIdIsNullOrderByCreatedAtAsc(UUID postId);

    java.util.List<Comment> findByParentIdOrderByCreatedAtAsc(UUID parentId);
}
