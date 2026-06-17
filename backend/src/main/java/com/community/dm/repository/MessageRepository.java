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
}
