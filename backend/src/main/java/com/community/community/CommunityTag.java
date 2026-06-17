package com.community.community;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "community_tags")
public class CommunityTag {

    @Id
    @Column(name = "id")
    private UUID id;

    @Column(name = "community_id", nullable = false)
    private UUID communityId;

    @Column(name = "name", nullable = false, length = 30)
    private String name;

    @Column(name = "color", nullable = false, length = 20)
    private String color = "#3B82F6";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public CommunityTag() {
        this.id = UUID.randomUUID();
        this.createdAt = Instant.now();
        this.color = "#3B82F6";
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getCommunityId() { return communityId; }
    public void setCommunityId(UUID communityId) { this.communityId = communityId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
