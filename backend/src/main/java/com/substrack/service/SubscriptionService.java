package com.substrack.service;

import com.substrack.dto.SubscriptionRequest;
import com.substrack.dto.SubscriptionResponse;
import com.substrack.exception.ResourceNotFoundException;
import com.substrack.model.Subscription;
import com.substrack.model.User;
import com.substrack.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final PriceCreepService priceCreepService;

    public SubscriptionResponse create(SubscriptionRequest request, User user) {
        Subscription subscription = Subscription.builder()
                .user(user)
                .name(request.getName())
                .description(request.getDescription())
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : "CAD")
                .billingCycle(request.getBillingCycle())
                .nextBillingDate(request.getNextBillingDate())
                .cancellationDate(request.getCancellationDate())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .category(request.getCategory())
                .build();

        return SubscriptionResponse.from(subscriptionRepository.save(subscription));
    }

    public List<SubscriptionResponse> getAll(User user) {
        return subscriptionRepository.findByUserId(user.getId()).stream()
                .map(SubscriptionResponse::from)
                .toList();
    }

    public SubscriptionResponse getById(Long id, User user) {
        return SubscriptionResponse.from(findOwnedOrThrow(id, user));
    }

    @Transactional
    public SubscriptionResponse update(Long id, SubscriptionRequest request, User user) {
        Subscription subscription = findOwnedOrThrow(id, user);

        priceCreepService.checkAndRecordPriceChange(subscription, request.getAmount());

        subscription.setName(request.getName());
        subscription.setDescription(request.getDescription());
        subscription.setAmount(request.getAmount());
        if (request.getCurrency() != null) {
            subscription.setCurrency(request.getCurrency());
        }
        subscription.setBillingCycle(request.getBillingCycle());
        subscription.setNextBillingDate(request.getNextBillingDate());
        subscription.setCancellationDate(request.getCancellationDate());
        if (request.getIsActive() != null) {
            subscription.setIsActive(request.getIsActive());
        }
        subscription.setCategory(request.getCategory());

        return SubscriptionResponse.from(subscriptionRepository.save(subscription));
    }

    public void delete(Long id, User user) {
        subscriptionRepository.delete(findOwnedOrThrow(id, user));
    }

    public Subscription getSubscriptionEntity(Long id, User user) {
        return findOwnedOrThrow(id, user);
    }

    public List<Subscription> getActiveSubscriptionEntities(User user) {
        return subscriptionRepository.findByUserIdAndIsActiveTrue(user.getId());
    }

    private Subscription findOwnedOrThrow(Long id, User user) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found: " + id));

        if (!subscription.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Subscription not found: " + id);
        }

        return subscription;
    }
}
