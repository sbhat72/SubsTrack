package com.substrack.service;

import com.substrack.model.Notification;
import com.substrack.model.NotificationType;
import com.substrack.model.PriceHistory;
import com.substrack.model.Subscription;
import com.substrack.repository.NotificationRepository;
import com.substrack.repository.PriceHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class PriceCreepService {

    private final PriceHistoryRepository priceHistoryRepository;
    private final NotificationRepository notificationRepository;

    @Transactional
    public void checkAndRecordPriceChange(Subscription subscription, BigDecimal newAmount) {
        if (newAmount.compareTo(subscription.getAmount()) <= 0) {
            return;
        }

        PriceHistory history = PriceHistory.builder()
                .subscription(subscription)
                .oldAmount(subscription.getAmount())
                .newAmount(newAmount)
                .build();
        priceHistoryRepository.save(history);

        String message = String.format(
                "Price increased for \"%s\": $%.2f → $%.2f %s",
                subscription.getName(),
                subscription.getAmount(),
                newAmount,
                subscription.getCurrency()
        );

        Notification notification = Notification.builder()
                .user(subscription.getUser())
                .subscription(subscription)
                .type(NotificationType.PRICE_INCREASE)
                .message(message)
                .build();
        notificationRepository.save(notification);
    }
}
