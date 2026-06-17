package com.community.community;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CommunityInviteLinkRepository extends JpaRepository<CommunityInviteLink, UUID> {
    List<CommunityInviteLink> findByCommunityIdOrderByCreatedAtDesc(UUID communityId);
    Optional<CommunityInviteLink> findByCode(String code);
    long countByCommunityIdAndActiveTrue(UUID communityId);
}
