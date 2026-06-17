package com.community.community;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommunityInviteRepository extends JpaRepository<CommunityInvite, UUID> {
    List<CommunityInvite> findByCommunityId(UUID communityId);
    Optional<CommunityInvite> findById(UUID id);
    Optional<CommunityInvite> findByCommunityIdAndInviteeId(UUID communityId, UUID inviteeId);
    List<CommunityInvite> findByInviteeIdAndStatus(UUID inviteeId, InviteStatus status);
    boolean existsByCommunityIdAndInviteeIdAndStatus(UUID communityId, UUID inviteeId, InviteStatus status);
}
