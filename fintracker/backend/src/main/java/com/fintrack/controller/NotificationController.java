package com.fintrack.controller;

import com.fintrack.entity.Notification;
import com.fintrack.repository.NotificationRepository;
import com.fintrack.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final SecurityUtils securityUtils;

    private Long getCurrentUserId() { 
        return securityUtils.getCurrentUserId(); 
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getAll() {
        return ResponseEntity.ok(notificationRepository.findByUserIdOrderByCreatedAtDesc(getCurrentUserId()));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnread() {
        return ResponseEntity.ok(notificationRepository.findByUserIdAndIsReadFalse(getCurrentUserId()));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        return ResponseEntity.ok(Map.of("count", notificationRepository.countByUserIdAndIsReadFalse(getCurrentUserId())));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markAsRead(@PathVariable Long id) {
        Notification n = notificationRepository.findById(id).orElseThrow();
        n.setRead(true);
        notificationRepository.save(n);
        return ResponseEntity.ok(Map.of("message", "Marked as read"));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllRead() {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalse(getCurrentUserId());
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
        return ResponseEntity.ok(Map.of("message", "All marked as read"));
    }
}
