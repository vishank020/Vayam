package com.community.community;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommunityTagRepository extends JpaRepository<CommunityTag, UUID> {
    List<CommunityTag> findByCommunityId(UUID communityId);

    @Query("SELECT t FROM CommunityTag t WHERE t.communityId = :communityId AND LOWER(t.name) = LOWER(:name)")
    Optional<CommunityTag> findByCommunityIdAndNameIgnoreCase(@Param("communityId") UUID communityId, @Param("name") String name);

    long countByCommunityId(UUID communityId);
}
