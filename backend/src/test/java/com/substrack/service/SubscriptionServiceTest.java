package com.substrack.service;

import com.substrack.dto.SubscriptionRequest;
import com.substrack.dto.SubscriptionResponse;
import com.substrack.exception.ResourceNotFoundException;
import com.substrack.model.BillingCycle;
import com.substrack.model.Subscription;
import com.substrack.model.User;
import com.substrack.repository.SubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {

    @Mock private SubscriptionRepository subscriptionRepository;
    @InjectMocks private SubscriptionService subscriptionService;

    private User owner;
    private User otherUser;
    private Subscription subscription;
    private SubscriptionRequest request;

    @BeforeEach
    void setUp() {
        owner = User.builder().id(1L).email("owner@example.com").passwordHash("x").fullName("Owner").build();
        otherUser = User.builder().id(2L).email("other@example.com").passwordHash("x").fullName("Other").build();

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

        request = new SubscriptionRequest();
        request.setName("Netflix");
        request.setAmount(new BigDecimal("15.99"));
        request.setBillingCycle(BillingCycle.MONTHLY);
        request.setNextBillingDate(LocalDate.now().plusMonths(1));
    }

    @Test
    void create_savesAndReturnsResponse() {
        when(subscriptionRepository.save(any(Subscription.class))).thenReturn(subscription);

        SubscriptionResponse response = subscriptionService.create(request, owner);

        assertThat(response.getName()).isEqualTo("Netflix");
        assertThat(response.getUserId()).isEqualTo(1L);
        verify(subscriptionRepository).save(any(Subscription.class));
    }

    @Test
    void getAll_returnsOnlyUserSubscriptions() {
        when(subscriptionRepository.findByUserId(1L)).thenReturn(List.of(subscription));

        List<SubscriptionResponse> results = subscriptionService.getAll(owner);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getName()).isEqualTo("Netflix");
    }

    @Test
    void getById_throwsNotFound_whenSubscriptionBelongsToOtherUser() {
        when(subscriptionRepository.findById(10L)).thenReturn(Optional.of(subscription));

        assertThatThrownBy(() -> subscriptionService.getById(10L, otherUser))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void delete_removesSubscription_whenOwnerRequests() {
        when(subscriptionRepository.findById(10L)).thenReturn(Optional.of(subscription));

        subscriptionService.delete(10L, owner);

        verify(subscriptionRepository).delete(subscription);
    }

    @Test
    void getById_throwsNotFound_whenSubscriptionDoesNotExist() {
        when(subscriptionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> subscriptionService.getById(99L, owner))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }
}
