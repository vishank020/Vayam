package com.community.community;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CommunityRuleRepository extends JpaRepository<CommunityRule, UUID> {
    List<CommunityRule> findByCommunityIdOrderByPositionAsc(UUID communityId);
    void deleteByCommunityId(UUID communityId);
}
