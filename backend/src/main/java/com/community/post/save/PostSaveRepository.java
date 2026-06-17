package com.community.post.save;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PostSaveRepository extends JpaRepository<PostSave, UUID> {
    Optional<PostSave> findByPostIdAndUserId(UUID postId, UUID userId);
    boolean existsByPostIdAndUserId(UUID postId, UUID userId);
    List<PostSave> findByPostIdInAndUserId(List<UUID> postIds, UUID userId);
    Page<PostSave> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
}
