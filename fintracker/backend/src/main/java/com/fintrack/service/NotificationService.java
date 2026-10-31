package com.fintrack.service;

import com.fintrack.entity.Notification;
import com.fintrack.entity.User;
import com.fintrack.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public Notification sendNotification(User user, String title, String message, Notification.NotificationType type, String actionUrl) {
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .actionUrl(actionUrl)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);

        // Broadcast to WebSocket user destination
        messagingTemplate.convertAndSendToUser(
                user.getId().toString(),
                "/queue/notifications",
                saved
        );

        // Also broadcast to public topic if needed, or user topic
        messagingTemplate.convertAndSend("/topic/notifications/" + user.getId(), saved);

        return saved;
    }

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}
