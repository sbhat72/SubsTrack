package com.substrack.service;

import com.substrack.model.BillingCycle;
import com.substrack.model.Notification;
import com.substrack.model.PriceHistory;
import com.substrack.model.Subscription;
import com.substrack.model.User;
import com.substrack.repository.NotificationRepository;
import com.substrack.repository.PriceHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PriceCreepServiceTest {

    @Mock private PriceHistoryRepository priceHistoryRepository;
    @Mock private NotificationRepository notificationRepository;
    @InjectMocks private PriceCreepService priceCreepService;

    private Subscription subscription;

    @BeforeEach
    void setUp() {
        User owner = User.builder()
                .id(1L).email("u@example.com").passwordHash("x").fullName("U").build();

        subscription = Subscription.builder()
                .id(10L)
                .user(owner)
                .name("Netflix")
                .amount(new BigDecimal("15.99"))
                .currency("CAD")
                .billingCycle(BillingCycle.MONTHLY)
                .nextBillingDate(LocalDate.now().plusMonths(1))
                .isActive(true)
                .build();
    }

    @Test
    void priceIncrease_savesPriceHistoryAndNotification() {
        BigDecimal newAmount = new BigDecimal("18.99");
        when(priceHistoryRepository.save(any(PriceHistory.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        priceCreepService.checkAndRecordPriceChange(subscription, newAmount);

        ArgumentCaptor<PriceHistory> historyCaptor = ArgumentCaptor.forClass(PriceHistory.class);
        verify(priceHistoryRepository).save(historyCaptor.capture());
        assertThat(historyCaptor.getValue().getOldAmount()).isEqualByComparingTo("15.99");
        assertThat(historyCaptor.getValue().getNewAmount()).isEqualByComparingTo("18.99");

        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(notifCaptor.capture());
        assertThat(notifCaptor.getValue().getMessage()).contains("Netflix");
        assertThat(notifCaptor.getValue().getMessage()).contains("15.99");
        assertThat(notifCaptor.getValue().getMessage()).contains("18.99");
    }

    @Test
    void priceDecrease_isIgnored() {
        priceCreepService.checkAndRecordPriceChange(subscription, new BigDecimal("12.99"));

        verify(priceHistoryRepository, never()).save(any());
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void samePrice_isIgnored() {
        priceCreepService.checkAndRecordPriceChange(subscription, new BigDecimal("15.99"));

        verify(priceHistoryRepository, never()).save(any());
        verify(notificationRepository, never()).save(any());
    }
}
