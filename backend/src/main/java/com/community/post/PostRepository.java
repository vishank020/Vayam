package com.community.post;

import com.community.post.PostType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {

    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' AND (:type IS NULL OR p.postType = :type) ORDER BY p.isPinned DESC, p.createdAt DESC")
    Page<Post> findAllByOrderByCreatedAtDesc(@Param("type") PostType type, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.communityId = :communityId AND p.status = 'PUBLISHED' AND (:type IS NULL OR p.postType = :type) AND (:tagId IS NULL OR p.tag.id = :tagId) ORDER BY p.isPinned DESC, p.createdAt DESC")
    Page<Post> findByCommunityIdOrderByCreatedAtDesc(@Param("communityId") UUID communityId, @Param("type") PostType type, @Param("tagId") UUID tagId, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.userId = :userId AND p.status != 'DRAFT' AND (:type IS NULL OR p.postType = :type) ORDER BY p.createdAt DESC")
    Page<Post> findByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId, @Param("type") PostType type, Pageable pageable);

    long countByUserId(UUID userId);

    @Query("SELECT p FROM Post p LEFT JOIN Community c ON p.communityId = c.id " +
           "WHERE (p.communityId IS NULL OR c.visibility = 'PUBLIC') " +
           "AND p.status = 'PUBLISHED' AND (:type IS NULL OR p.postType = :type) ORDER BY p.createdAt DESC")
    Page<Post> findGlobalFeed(@Param("type") PostType type, Pageable pageable);

    @Query("SELECT p FROM Post p LEFT JOIN Community c ON p.communityId = c.id " +
           "WHERE (p.communityId IS NULL OR c.visibility = 'PUBLIC') " +
           "AND p.status = 'PUBLISHED' AND p.userId NOT IN :excludedIds AND (:type IS NULL OR p.postType = :type) ORDER BY p.createdAt DESC")
    Page<Post> findGlobalFeedExcluding(@Param("excludedIds") List<UUID> excludedIds, @Param("type") PostType type, Pageable pageable);

    @Query("SELECT p FROM Post p LEFT JOIN Community c ON p.communityId = c.id " +
           "WHERE (p.communityId IS NULL OR c.visibility = 'PUBLIC' OR p.communityId IN (SELECT m.community.id FROM CommunityMember m WHERE m.user.id = :userId)) " +
           "AND p.status = 'PUBLISHED' AND (:type IS NULL OR p.postType = :type) ORDER BY p.createdAt DESC")
    Page<Post> findPersonalizedFeed(@Param("userId") UUID userId, @Param("type") PostType type, Pageable pageable);

    @Query("SELECT p FROM Post p LEFT JOIN Community c ON p.communityId = c.id " +
           "WHERE (p.communityId IS NULL OR c.visibility = 'PUBLIC' OR p.communityId IN (SELECT m.community.id FROM CommunityMember m WHERE m.user.id = :userId)) " +
           "AND p.status = 'PUBLISHED' AND p.userId NOT IN :excludedIds AND (:type IS NULL OR p.postType = :type) ORDER BY p.createdAt DESC")
    Page<Post> findPersonalizedFeedExcluding(@Param("userId") UUID userId, @Param("excludedIds") List<UUID> excludedIds, @Param("type") PostType type, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.communityId = :communityId AND p.status = 'PUBLISHED' AND p.userId NOT IN :excludedIds AND (:type IS NULL OR p.postType = :type) AND (:tagId IS NULL OR p.tag.id = :tagId) ORDER BY p.isPinned DESC, p.createdAt DESC")
    Page<Post> findByCommunityIdExcluding(@Param("communityId") UUID communityId, @Param("excludedIds") List<UUID> excludedIds, @Param("type") PostType type, @Param("tagId") UUID tagId, Pageable pageable);

    @Query("SELECT p FROM Post p JOIN PostVote v ON p.id = v.postId WHERE v.userId = :userId AND v.direction = 1 ORDER BY v.createdAt DESC")
    Page<Post> findUpvotedPostsByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT p FROM Post p JOIN PostSave s ON p.id = s.postId WHERE s.userId = :userId ORDER BY s.createdAt DESC")
    Page<Post> findSavedPostsByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.status = 'SCHEDULED' AND p.scheduledAt <= :now ORDER BY p.scheduledAt ASC")
    List<Post> findScheduledPostsDueForPublishing(@Param("now") Instant now);

    long countByCommunityIdAndStatus(UUID communityId, PostStatus status);

    long countByCommunityId(UUID communityId);

    @Query("SELECT COUNT(DISTINCT p.userId) FROM Post p WHERE p.communityId = :communityId AND p.status = 'PUBLISHED'")
    long countDistinctActiveAuthorsByCommunityId(@Param("communityId") UUID communityId);

    @Query("SELECT p FROM Post p WHERE p.userId = :userId AND p.status = 'DRAFT' ORDER BY p.updatedAt DESC")
    Page<Post> findDraftsByUserId(@Param("userId") UUID userId, Pageable pageable);
}
