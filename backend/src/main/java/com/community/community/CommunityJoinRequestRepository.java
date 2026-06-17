package com.community.community;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CommunityJoinRequestRepository extends JpaRepository<CommunityJoinRequest, UUID> {
    List<CommunityJoinRequest> findByCommunityIdOrderByCreatedAtDesc(UUID communityId);
    Optional<CommunityJoinRequest> findByCommunityIdAndUserId(UUID communityId, UUID userId);
    boolean existsByCommunityIdAndUserIdAndStatus(UUID communityId, UUID userId, JoinRequestStatus status);
}
