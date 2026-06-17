package com.community.community;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CommunityBanRepository extends JpaRepository<CommunityBan, UUID> {
    List<CommunityBan> findByCommunityIdOrderByCreatedAtDesc(UUID communityId);
    Optional<CommunityBan> findByCommunityIdAndUserId(UUID communityId, UUID userId);
    boolean existsByCommunityIdAndUserId(UUID communityId, UUID userId);

    @Query("SELECT cb.user.id FROM CommunityBan cb WHERE cb.community.id = :communityId")
    List<UUID> findBannedUserIdsByCommunityId(@Param("communityId") UUID communityId);
}
