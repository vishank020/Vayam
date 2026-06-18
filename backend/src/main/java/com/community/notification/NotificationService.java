package com.community.notification;

import com.community.auth.AuthPrincipal;
import com.community.notification.dto.NotificationResponse;
import com.community.user.User;
import com.community.user.UserProfileRepository;
import com.community.user.UserRepository;
import com.community.block.BlockService;
import com.community.mute.MuteService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final BlockService blockService;
    private final MuteService muteService;

    public NotificationService(NotificationRepository notificationRepository,
                                SimpMessagingTemplate messagingTemplate,
                                UserRepository userRepository,
                                UserProfileRepository userProfileRepository,
                                BlockService blockService,
                                MuteService muteService) {
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.blockService = blockService;
        this.muteService = muteService;
    }

    @Transactional
    public NotificationResponse createNotification(UUID userId, NotificationType type, UUID referenceId, String referenceType, UUID actorId, String message) {
        if (actorId != null) {
            if (blockService.isBlocked(userId, actorId) || muteService.isMuted(userId, actorId)) {
                return null; // Do not create notification if the actor is blocked or muted by the recipient
            }
        }
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setReferenceId(referenceId);
        notification.setReferenceType(referenceType);
        notification.setActorId(actorId);
        notification.setMessage(message);

        notificationRepository.save(notification);

        NotificationResponse response = toResponse(notification);

        String recipientUsername = userRepository.findById(userId)
                .map(User::getUsername)
                .orElse(null);

        if (recipientUsername != null) {
            messagingTemplate.convertAndSendToUser(
                    recipientUsername,
                    "/queue/notifications",
                    response
            );
        }

        return response;
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(AuthPrincipal principal, Pageable pageable) {
        UUID userId = UUID.fromString(principal.userId());
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(AuthPrincipal principal) {
        UUID userId = UUID.fromString(principal.userId());
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(UUID notificationId, AuthPrincipal principal) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        if (!notification.getUserId().equals(UUID.fromString(principal.userId()))) {
            throw new IllegalArgumentException("Notification does not belong to this user");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(AuthPrincipal principal) {
        UUID userId = UUID.fromString(principal.userId());
        notificationRepository.markAllAsReadByUserId(userId);
    }

    private NotificationResponse toResponse(Notification notification) {
        String actorUsername = null;
        String actorAvatarUrl = null;
        if (notification.getActorId() != null) {
            actorUsername = userRepository.findById(notification.getActorId())
                    .map(User::getUsername)
                    .orElse(null);
            actorAvatarUrl = userProfileRepository.findByUserId(notification.getActorId())
                    .map(com.community.user.UserProfile::getAvatarUrl)
                    .orElse(null);
        }

        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getReferenceId(),
                notification.getReferenceType(),
                actorUsername,
                actorAvatarUrl,
                notification.getMessage(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
