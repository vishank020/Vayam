package com.community.mute;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "mutes", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"muter_id", "muted_id"})
})
public class Mute {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "muter_id", nullable = false)
    private UUID muterId;

    @Column(name = "muted_id", nullable = false)
    private UUID mutedId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getMuterId() { return muterId; }
    public void setMuterId(UUID muterId) { this.muterId = muterId; }
    public UUID getMutedId() { return mutedId; }
    public void setMutedId(UUID mutedId) { this.mutedId = mutedId; }
    public Instant getCreatedAt() { return createdAt; }
}
