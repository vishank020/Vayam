package com.community.post;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PostAnonymousMapRepository extends JpaRepository<PostAnonymousMap, UUID> {
    Optional<PostAnonymousMap> findByPostId(UUID postId);
}