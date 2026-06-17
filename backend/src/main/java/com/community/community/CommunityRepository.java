package com.community.community;

import com.community.community.CommunityVisibility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommunityRepository extends JpaRepository<Community, UUID> {
    Page<Community> findByVisibility(CommunityVisibility visibility, Pageable pageable);
    Page<Community> findByVisibilityIn(java.util.Collection<CommunityVisibility> visibilities, Pageable pageable);
    Optional<Community> findById(UUID id);
    Optional<Community> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
