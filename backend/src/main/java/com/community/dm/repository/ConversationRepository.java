package com.community.dm.repository;

import com.community.dm.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @Query("SELECT DISTINCT cp.conversation.id FROM ConversationParticipant cp WHERE cp.user.id = :userId")
    List<UUID> findConversationIdsByUserId(UUID userId);

    @Query("SELECT cp.conversation.id FROM ConversationParticipant cp " +
           "WHERE cp.user.id IN :userIds GROUP BY cp.conversation.id " +
           "HAVING COUNT(DISTINCT cp.user.id) = :count")
    List<UUID> findConversationWithExactParticipants(Set<UUID> userIds, long count);
}
