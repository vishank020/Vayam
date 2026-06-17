package com.community.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {
    Optional<UserProfile> findByUserId(UUID userId);
    List<UserProfile> findByUserIdIn(List<UUID> userIds);

    @Query("SELECT up FROM UserProfile up JOIN FETCH up.user WHERE up.user.id IN :userIds")
    List<UserProfile> findByUserIdInWithUser(@Param("userIds") List<UUID> userIds);
}
