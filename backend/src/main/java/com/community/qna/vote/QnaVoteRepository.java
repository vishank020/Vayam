package com.community.qna.vote;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QnaVoteRepository extends JpaRepository<QnaVote, UUID> {

    Optional<QnaVote> findByUserIdAndTargetIdAndTargetType(UUID userId, UUID targetId, String targetType);

    @Query("SELECT COALESCE(SUM(v.value), 0) FROM QnaVote v WHERE v.targetId = :targetId AND v.targetType = :targetType")
    int sumValueByTargetIdAndTargetType(@Param("targetId") UUID targetId, @Param("targetType") String targetType);

    @Query("SELECT v.targetId, COALESCE(SUM(v.value), 0) FROM QnaVote v WHERE v.targetId IN :targetIds AND v.targetType = :targetType GROUP BY v.targetId")
    List<Object[]> sumValueByTargetIdsAndTargetType(@Param("targetIds") List<UUID> targetIds, @Param("targetType") String targetType);

    @Query("SELECT v FROM QnaVote v WHERE v.targetId IN :targetIds AND v.userId = :userId AND v.targetType = :targetType")
    List<QnaVote> findByTargetIdsAndUserIdAndTargetType(@Param("targetIds") List<UUID> targetIds, @Param("userId") UUID userId, @Param("targetType") String targetType);
}
