package com.community.mute;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface MuteRepository extends JpaRepository<Mute, UUID> {
    boolean existsByMuterIdAndMutedId(UUID muterId, UUID mutedId);
    void deleteByMuterIdAndMutedId(UUID muterId, UUID mutedId);
    
    @Query("SELECT m.mutedId FROM Mute m WHERE m.muterId = :muterId")
    List<UUID> findMutedIdsByMuterId(@Param("muterId") UUID muterId);
}
