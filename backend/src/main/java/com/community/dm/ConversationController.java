package com.community.dm;

import com.community.auth.AuthPrincipal;
import com.community.dm.dto.ConversationResponse;
import com.community.dm.dto.CreateConversationRequest;
import com.community.dm.dto.MessageResponse;
import com.community.dm.dto.SendMessageRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.community.dm.repository.ConversationParticipantRepository;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ConversationParticipantRepository participantRepository;

    @PostMapping
    public ResponseEntity<ConversationResponse> createConversation(
            @Valid @RequestBody CreateConversationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(conversationService.createConversation(getPrincipal(), request.participantIds()));
    }

    @GetMapping
    public ResponseEntity<List<ConversationResponse>> getConversations() {
        return ResponseEntity.ok(conversationService.getConversations(getPrincipal()));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<Page<MessageResponse>> getMessages(
            @PathVariable UUID id, Pageable pageable) {
        return ResponseEntity.ok(conversationService.getMessages(id, getPrincipal(), pageable));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable UUID id,
            @Valid @RequestBody SendMessageRequest request) {
        MessageResponse msg = conversationService.sendMessage(id, getPrincipal(), request.body());
        notifyParticipants(id, msg);
        return ResponseEntity.status(HttpStatus.CREATED).body(msg);
    }

    @MessageMapping("/chat.sendMessage")
    public void handleWebSocketMessage(@Payload WebSocketMessagePayload payload) {
        AuthPrincipal principal = getPrincipal();
        if (principal == null) return;
        MessageResponse msg = conversationService.sendMessage(
                payload.conversationId(), principal, payload.body());
        notifyParticipants(payload.conversationId(), msg);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID id) {
        conversationService.markAsRead(id, getPrincipal());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        return ResponseEntity.ok(Map.of("unreadCount", conversationService.getTotalUnreadCount(getPrincipal())));
    }

    @PutMapping("/{id}/messages/{messageId}")
    public ResponseEntity<MessageResponse> editMessage(
            @PathVariable UUID id,
            @PathVariable UUID messageId,
            @Valid @RequestBody SendMessageRequest request) {
        return ResponseEntity.ok(conversationService.editMessage(id, messageId, request.body(), getPrincipal()));
    }

    @DeleteMapping("/{id}/messages/{messageId}")
    public ResponseEntity<MessageResponse> deleteMessage(
            @PathVariable UUID id,
            @PathVariable UUID messageId) {
        return ResponseEntity.ok(conversationService.deleteMessage(id, messageId, getPrincipal()));
    }

    private void notifyParticipants(UUID conversationId, MessageResponse msg) {
        messagingTemplate.convertAndSend("/topic/chat/" + conversationId, msg);
        List<ConversationParticipant> participants = participantRepository.findByConversationId(conversationId);
        for (ConversationParticipant cp : participants) {
            messagingTemplate.convertAndSendToUser(
                cp.getUser().getUsername(),
                "/queue/messages",
                msg
            );
        }
    }

    private AuthPrincipal getPrincipal() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthPrincipal) {
            return (AuthPrincipal) auth.getPrincipal();
        }
        return null;
    }
}

record WebSocketMessagePayload(UUID conversationId, String body) {}
