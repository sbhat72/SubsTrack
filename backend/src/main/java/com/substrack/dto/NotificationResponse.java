package com.substrack.dto;

import com.substrack.model.Notification;
import com.substrack.model.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {

    private Long id;
    private Long subscriptionId;
    private String subscriptionName;
    private NotificationType type;
    private String message;
    private Boolean isRead;
    private LocalDateTime createdAt;

    public static NotificationResponse from(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .subscriptionId(n.getSubscription() != null ? n.getSubscription().getId() : null)
                .subscriptionName(n.getSubscription() != null ? n.getSubscription().getName() : null)
                .type(n.getType())
                .message(n.getMessage())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
