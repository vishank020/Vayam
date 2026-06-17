package com.community.community;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ModerationLogRepository extends JpaRepository<ModerationLog, UUID> {
    List<ModerationLog> findByCommunityIdOrderByCreatedAtDesc(UUID communityId);
}
