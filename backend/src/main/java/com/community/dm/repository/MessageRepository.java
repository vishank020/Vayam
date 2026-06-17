package com.community.dm.repository;

import com.community.dm.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
    Page<Message> findByConversationIdOrderBySentAtDesc(UUID conversationId, Pageable pageable);

    @Query(value = """
        SELECT DISTINCT ON (m.conversation_id) m.id, m.conversation_id, m.sender_id, m.body, m.sent_at, m.read_at
        FROM messages m
        WHERE m.conversation_id IN (:ids)
        ORDER BY m.conversation_id, m.sent_at DESC
        """, nativeQuery = true)
    List<Object[]> findLastMessagePerConversation(@Param("ids") List<UUID> conversationIds);

    @Modifying
    @Query("UPDATE Message m SET m.readAt = :now WHERE m.conversationId = :conversationId AND m.senderId <> :userId AND m.readAt IS NULL")
    int markAsRead(@Param("conversationId") UUID conversationId, @Param("userId") UUID userId, @Param("now") Instant now);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.readAt IS NULL AND m.senderId <> :userId AND m.conversationId IN (SELECT cp.conversation.id FROM ConversationParticipant cp WHERE cp.user.id = :userId)")
    long countTotalUnreadMessages(@Param("userId") UUID userId);

    @Query("SELECT m.conversationId, COUNT(m) FROM Message m WHERE m.conversationId IN (:ids) AND m.senderId <> :userId AND m.readAt IS NULL GROUP BY m.conversationId")
    List<Object[]> countUnreadPerConversation(@Param("ids") List<UUID> conversationIds, @Param("userId") UUID userId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversationId = :conversationId AND m.senderId <> :userId AND m.readAt IS NULL")
    long countUnreadMessages(@Param("conversationId") UUID conversationId, @Param("userId") UUID userId);
}
