package com.community.dm;

import com.community.auth.AuthPrincipal;
import com.community.dm.dto.ConversationResponse;
import com.community.dm.dto.MessageResponse;
import com.community.dm.repository.ConversationParticipantRepository;
import com.community.dm.repository.ConversationRepository;
import com.community.dm.repository.MessageRepository;
import com.community.user.User;
import com.community.user.UserProfile;
import com.community.user.UserProfileRepository;
import com.community.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ConversationService(ConversationRepository conversationRepository,
                               ConversationParticipantRepository participantRepository,
                               MessageRepository messageRepository,
                               UserRepository userRepository,
                               UserProfileRepository userProfileRepository,
                               SimpMessagingTemplate messagingTemplate) {
        this.conversationRepository = conversationRepository;
        this.participantRepository = participantRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public ConversationResponse createConversation(AuthPrincipal principal, Set<UUID> participantIds) {
        if (principal == null) {
            throw new IllegalArgumentException("Authentication required");
        }
        UUID currentUserId = UUID.fromString(principal.userId());
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!currentUser.isEmailVerified()) {
            throw new IllegalArgumentException("Email address is not verified. Please verify your email to perform this action.");
        }

        Set<UUID> allIds = new HashSet<>(participantIds);
        allIds.add(currentUserId);

        if (allIds.size() < 2) {
            throw new IllegalArgumentException("Conversation must have at least 2 participants");
        }

        List<UUID> existing = conversationRepository.findConversationWithExactParticipants(allIds, (long) allIds.size());
        if (!existing.isEmpty()) {
            return toResponse(existing.get(0), currentUserId);
        }

        Conversation conversation = new Conversation();
        conversationRepository.save(conversation);

        for (UUID uid : allIds) {
            User user = userRepository.findById(uid)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + uid));
            ConversationParticipant cp = new ConversationParticipant();
            cp.setConversation(conversation);
            cp.setUser(user);
            participantRepository.save(cp);
        }

        return toResponse(conversation.getId(), currentUserId);
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversations(AuthPrincipal principal) {
        if (principal == null) return List.of();
        UUID userId = UUID.fromString(principal.userId());

        // Step 1: Get conversation IDs for this user (1 query)
        List<UUID> ids = conversationRepository.findConversationIdsByUserId(userId);
        if (ids.isEmpty()) return List.of();

        // Step 2: Fetch all participants for those conversations (1 query)
        List<ConversationParticipant> allParticipants = participantRepository.findByConversationIdIn(ids);
        Map<UUID, List<ConversationParticipant>> participantsByConv = allParticipants.stream()
                .collect(Collectors.groupingBy(cp -> cp.getConversation().getId()));

        // Step 3: Fetch user profiles for all participant user IDs (1 query)
        Set<UUID> allUserIds = allParticipants.stream()
                .map(cp -> cp.getUser().getId())
                .collect(Collectors.toSet());
        List<UserProfile> profiles = userProfileRepository.findByUserIdInWithUser(new ArrayList<>(allUserIds));
        Map<UUID, UserProfile> profileByUserId = profiles.stream()
                .collect(Collectors.toMap(p -> p.getUser().getId(), p -> p));

        // Step 4: Fetch last message per conversation with DISTINCT ON (1 query)
        List<Object[]> lastMessageRows = messageRepository.findLastMessagePerConversation(ids);
        Map<UUID, Message> lastMessageByConv = new HashMap<>();
        for (Object[] row : lastMessageRows) {
            UUID convId = (UUID) row[1];
            Message m = new Message();
            m.setId((UUID) row[0]);
            m.setConversationId(convId);
            m.setSenderId((UUID) row[2]);
            m.setBody((String) row[3]);
            m.setSentAt(convertTimestamp(row[4]));
            if (row[5] != null) m.setReadAt(convertTimestamp(row[5]));
            lastMessageByConv.put(convId, m);
        }

        // Step 5: Fetch unread counts in batch (1 query)
        List<Object[]> unreadCounts = messageRepository.countUnreadPerConversation(ids, userId);
        Map<UUID, Long> unreadCountMap = new HashMap<>();
        for (Object[] row : unreadCounts) {
            unreadCountMap.put((UUID) row[0], (Long) row[1]);
        }

        // Step 6: Fetch conversation entities (1 query)
        Map<UUID, Conversation> conversationMap = new HashMap<>();
        for (Conversation c : conversationRepository.findAllById(ids)) {
            conversationMap.put(c.getId(), c);
        }

        // Step 7: Assemble responses from maps
        List<ConversationResponse> responses = new ArrayList<>(ids.size());
        for (UUID convId : ids) {
            List<ConversationParticipant> participants = participantsByConv.getOrDefault(convId, List.of());
            UUID otherUserId = participants.stream()
                    .map(cp -> cp.getUser().getId())
                    .filter(id -> !id.equals(userId))
                    .findFirst().orElse(null);

            String otherUsername = null;
            String otherDisplayName = null;
            if (otherUserId != null) {
                UserProfile otherProfile = profileByUserId.get(otherUserId);
                if (otherProfile != null) {
                    otherUsername = otherProfile.getUser().getUsername();
                    otherDisplayName = otherProfile.getDisplayName();
                }
            }

            Message lastMsg = lastMessageByConv.get(convId);
            Conversation conv = conversationMap.get(convId);
            long unreadCount = unreadCountMap.getOrDefault(convId, 0L);

            responses.add(new ConversationResponse(
                    convId, otherUserId, otherUsername, otherDisplayName,
                    lastMsg != null ? lastMsg.getBody() : null,
                    lastMsg != null ? lastMsg.getSentAt() : null,
                    conv != null ? conv.getCreatedAt() : null,
                    unreadCount
            ));
        }

        responses.sort(Comparator.comparing(ConversationResponse::lastMessageAt,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return responses;
    }

    @Transactional
    public void markAsRead(UUID conversationId, AuthPrincipal principal) {
        if (principal == null) throw new IllegalArgumentException("Authentication required");
        UUID userId = UUID.fromString(principal.userId());
        boolean isParticipant = participantRepository.findByConversationIdAndUserId(conversationId, userId).isPresent();
        if (!isParticipant) throw new IllegalArgumentException("Not a participant in this conversation");
        
        messageRepository.markAsRead(conversationId, userId, Instant.now());

        // Broadcast read receipt event
        MessageResponse receipt = new MessageResponse(null, conversationId, userId, null, "READ_RECEIPT", Instant.now(), Instant.now(), false, false);
        messagingTemplate.convertAndSend("/topic/chat/" + conversationId, receipt);
    }

    @Transactional(readOnly = true)
    public Page<MessageResponse> getMessages(UUID conversationId, AuthPrincipal principal, Pageable pageable) {
        if (principal == null) {
            throw new IllegalArgumentException("Authentication required");
        }
        UUID userId = UUID.fromString(principal.userId());
        boolean isParticipant = participantRepository.findByConversationIdAndUserId(conversationId, userId).isPresent();
        if (!isParticipant) {
            throw new IllegalArgumentException("Not a participant in this conversation");
        }
        return messageRepository.findByConversationIdOrderBySentAtDesc(conversationId, pageable)
                .map(this::toMessageResponse);
    }

    @Transactional
    public MessageResponse sendMessage(UUID conversationId, AuthPrincipal principal, String body) {
        if (principal == null) {
            throw new IllegalArgumentException("Authentication required");
        }
        UUID userId = UUID.fromString(principal.userId());
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!currentUser.isEmailVerified()) {
            throw new IllegalArgumentException("Email address is not verified. Please verify your email to perform this action.");
        }

        boolean isParticipant = participantRepository.findByConversationIdAndUserId(conversationId, userId).isPresent();
        if (!isParticipant) {
            throw new IllegalArgumentException("Not a participant in this conversation");
        }

        Message msg = new Message();
        msg.setConversationId(conversationId);
        msg.setSenderId(userId);
        msg.setBody(body);
        messageRepository.save(msg);

        return toMessageResponse(msg);
    }

    @Transactional
    public MessageResponse editMessage(UUID conversationId, UUID messageId, String newBody, AuthPrincipal principal) {
        if (principal == null) throw new IllegalArgumentException("Authentication required");
        UUID userId = UUID.fromString(principal.userId());
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!currentUser.isEmailVerified()) {
            throw new IllegalArgumentException("Email address is not verified. Please verify your email to perform this action.");
        }

        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));

        if (!msg.getConversationId().equals(conversationId)) {
            throw new IllegalArgumentException("Message does not belong to this conversation");
        }

        if (!msg.getSenderId().equals(userId)) {
            throw new IllegalArgumentException("Only the sender can edit this message");
        }

        if (msg.isDeleted()) {
            throw new IllegalArgumentException("Cannot edit a deleted message");
        }

        msg.setBody(newBody);
        msg.setEdited(true);
        messageRepository.save(msg);

        MessageResponse response = toMessageResponse(msg);
        messagingTemplate.convertAndSend("/topic/chat/" + conversationId, response);
        return response;
    }

    @Transactional
    public MessageResponse deleteMessage(UUID conversationId, UUID messageId, AuthPrincipal principal) {
        if (principal == null) throw new IllegalArgumentException("Authentication required");
        UUID userId = UUID.fromString(principal.userId());
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!currentUser.isEmailVerified()) {
            throw new IllegalArgumentException("Email address is not verified. Please verify your email to perform this action.");
        }

        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));

        if (!msg.getConversationId().equals(conversationId)) {
            throw new IllegalArgumentException("Message does not belong to this conversation");
        }

        if (!msg.getSenderId().equals(userId)) {
            throw new IllegalArgumentException("Only the sender can delete this message");
        }

        msg.setBody("[Message deleted]");
        msg.setDeleted(true);
        messageRepository.save(msg);

        MessageResponse response = toMessageResponse(msg);
        messagingTemplate.convertAndSend("/topic/chat/" + conversationId, response);
        return response;
    }

    @Transactional(readOnly = true)
    public long getTotalUnreadCount(AuthPrincipal principal) {
        if (principal == null) return 0L;
        return messageRepository.countTotalUnreadMessages(UUID.fromString(principal.userId()));
    }

    private ConversationResponse toResponse(UUID conversationId, UUID currentUserId) {
        List<ConversationParticipant> participants = participantRepository.findByConversationId(conversationId);
        UUID otherUserId = participants.stream()
                .map(cp -> cp.getUser().getId())
                .filter(id -> !id.equals(currentUserId))
                .findFirst().orElse(null);

        String otherUsername = null;
        String otherDisplayName = null;
        if (otherUserId != null) {
            UserProfile profile = userProfileRepository.findByUserId(otherUserId).orElse(null);
            otherUsername = profile != null && profile.getUser() != null ? profile.getUser().getUsername() : null;
            otherDisplayName = profile != null ? profile.getDisplayName() : null;
        }

        String lastMessage = null;
        Instant lastMessageAt = null;
        var msgPage = messageRepository.findByConversationIdOrderBySentAtDesc(conversationId, PageRequest.of(0, 1));
        if (msgPage.hasContent()) {
            Message m = msgPage.getContent().get(0);
            lastMessage = m.getBody();
            lastMessageAt = m.getSentAt();
        }

        Conversation c = conversationRepository.findById(conversationId).orElse(null);
        long unreadCount = messageRepository.countUnreadMessages(conversationId, currentUserId);

        return new ConversationResponse(
                conversationId, otherUserId, otherUsername, otherDisplayName,
                lastMessage, lastMessageAt, c != null ? c.getCreatedAt() : null,
                unreadCount
        );
    }

    private MessageResponse toMessageResponse(Message msg) {
        String username = null;
        UserProfile profile = userProfileRepository.findByUserId(msg.getSenderId()).orElse(null);
        if (profile != null && profile.getUser() != null) {
            username = profile.getUser().getUsername();
        }
        return new MessageResponse(
                msg.getId(), msg.getConversationId(), msg.getSenderId(),
                username, msg.getBody(), msg.getSentAt(), msg.getReadAt(),
                msg.isDeleted(), msg.isEdited()
        );
    }

    private Instant convertTimestamp(Object value) {
        if (value instanceof Instant instant) return instant;
        if (value instanceof java.sql.Timestamp ts) return ts.toInstant();
        return null;
    }
}
